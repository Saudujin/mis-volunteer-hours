import { google, sheets_v4 } from "googleapis";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Initialize Google Sheets API
function getGoogleAuth() {
  const credentials = ENV.googleServiceAccountKey;
  if (!credentials) {
    throw new Error("Google Service Account credentials not configured");
  }

  // Parse credentials and fix private key format if needed
  const parsedCredentials = JSON.parse(credentials);
  
  // Fix private key format - restore spaces that may have been stripped
  if (parsedCredentials.private_key) {
    parsedCredentials.private_key = parsedCredentials.private_key
      .replace(/-----BEGINPRIVATEKEY-----/g, '-----BEGIN PRIVATE KEY-----')
      .replace(/-----ENDPRIVATEKEY-----/g, '-----END PRIVATE KEY-----');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: parsedCredentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  return auth;
}

function getSheetsClient(): sheets_v4.Sheets {
  const auth = getGoogleAuth();
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = ENV.googleSpreadsheetId || "";

// Sheet names
const SHEETS = {
  MEMBERS: "Members",
  REQUESTS: "Requests",
  ACHIEVEMENT_TYPES: "AchievementTypes",
};

export interface AchievementType {
  id: string;
  name: string;
  hours: number;
}

export interface PendingRequest {
  rowIndex: number;
  universityId: string;
  description: string;
  hours: number;
  imageLink: string;
  date: string;
  approved: boolean;
}

export interface Member {
  universityId: string;
  name: string;
  email: string;
  phone: string;
  committee: string;
  totalHours: number;
  achievements: string;
}

// Get achievement types from AchievementTypes sheet (for reference/admin)
export async function getAchievementTypes(): Promise<AchievementType[]> {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.ACHIEVEMENT_TYPES}!A2:C`,
    });

    const rows = response.data.values || [];
    return rows.map((row: string[], index: number) => ({
      id: `type_${index}`,
      name: row[0] || "",
      hours: parseFloat(row[1]) || 0,
    }));
  } catch (error) {
    console.error("Error fetching achievement types:", error);
    return [];
  }
}

// Add new achievement type
export async function addAchievementType(
  name: string,
  hours: number
): Promise<boolean> {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.ACHIEVEMENT_TYPES}!A:C`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, hours, new Date().toISOString()]],
      },
    });
    return true;
  } catch (error) {
    console.error("Error adding achievement type:", error);
    return false;
  }
}

// Delete achievement type by row index
export async function deleteAchievementType(rowIndex: number): Promise<boolean> {
  try {
    const sheets = getSheetsClient();

    // Get the sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s: sheets_v4.Schema$Sheet) => s.properties?.title === SHEETS.ACHIEVEMENT_TYPES
    );

    if (!sheet?.properties?.sheetId) {
      throw new Error("AchievementTypes sheet not found");
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1, // +1 for header row
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error("Error deleting achievement type:", error);
    return false;
  }
}

// Upload image to S3 storage and return the link
export async function uploadImageToStorage(
  base64Data: string,
  fileName: string
): Promise<string> {
  try {
    // Extract the base64 content (remove data:image/...;base64, prefix)
    const base64Content = base64Data.split(",")[1];
    const mimeType = base64Data.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, "base64");

    // Generate unique file name
    const ext = fileName.split(".").pop() || "jpg";
    const uniqueFileName = `volunteer-proofs/${Date.now()}-${nanoid(8)}.${ext}`;

    // Upload to S3 storage
    const { url } = await storagePut(uniqueFileName, buffer, mimeType);

    return url;
  } catch (error) {
    console.error("Error uploading to storage:", error);
    throw new Error("Failed to upload image");
  }
}

// Submit a new volunteer hours request
export async function submitRequest(data: {
  universityId: string;
  description: string;
  imageLink: string;
}): Promise<boolean> {
  try {
    const sheets = getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.REQUESTS}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            data.universityId,
            data.description,
            "", // Hours - will be set by admin when approving
            data.imageLink,
            new Date().toISOString(),
            "FALSE", // Approved column
            "", // Approved by
          ],
        ],
      },
    });
    return true;
  } catch (error) {
    console.error("Error submitting request:", error);
    return false;
  }
}

// Get all pending requests (not approved)
export async function getPendingRequests(): Promise<PendingRequest[]> {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.REQUESTS}!A2:G`,
    });

    const rows = response.data.values || [];
    return rows
      .map((row: string[], index: number) => ({
        rowIndex: index,
        universityId: row[0] || "",
        description: row[1] || "",
        hours: parseFloat(row[2]) || 0,
        imageLink: row[3] || "",
        date: row[4] || "",
        approved: row[5]?.toUpperCase() === "TRUE",
      }))
      .filter((r: PendingRequest) => !r.approved);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
}

// Get all requests (for admin view)
export async function getAllRequests(): Promise<PendingRequest[]> {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.REQUESTS}!A2:G`,
    });

    const rows = response.data.values || [];
    return rows.map((row: string[], index: number) => ({
      rowIndex: index,
      universityId: row[0] || "",
      description: row[1] || "",
      hours: parseFloat(row[2]) || 0,
      imageLink: row[3] || "",
      date: row[4] || "",
      approved: row[5]?.toUpperCase() === "TRUE",
    }));
  } catch (error) {
    console.error("Error fetching all requests:", error);
    return [];
  }
}

// Approve a request with hours
export async function approveRequest(
  rowIndex: number,
  hours: number,
  approvedBy: string
): Promise<boolean> {
  try {
    const sheets = getSheetsClient();

    // Update the hours column (C), approved column (F) and approved by column (G)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.REQUESTS}!C${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[hours]],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.REQUESTS}!F${rowIndex + 2}:G${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["TRUE", approvedBy]],
      },
    });

    return true;
  } catch (error) {
    console.error("Error approving request:", error);
    return false;
  }
}

// Reject (delete) a request
export async function rejectRequest(rowIndex: number): Promise<boolean> {
  try {
    const sheets = getSheetsClient();

    // Get the sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find(
      (s: sheets_v4.Schema$Sheet) => s.properties?.title === SHEETS.REQUESTS
    );

    if (!sheet?.properties?.sheetId) {
      throw new Error("Requests sheet not found");
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1, // +1 for header row
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
    return true;
  } catch (error) {
    console.error("Error rejecting request:", error);
    return false;
  }
}

// Get all members with their cumulative hours
export async function getMembers(): Promise<Member[]> {
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.MEMBERS}!A2:G`,
    });

    const rows = response.data.values || [];
    return rows.map((row: string[]) => ({
      universityId: row[0] || "",
      name: row[1] || "",
      email: row[2] || "",
      phone: row[3] || "",
      committee: row[4] || "",
      totalHours: parseFloat(row[5]) || 0,
      achievements: row[6] || "",
    }));
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}
