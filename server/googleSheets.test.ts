import { describe, expect, it } from "vitest";
import { google } from "googleapis";

// Helper function to fix private key format
function fixCredentials(credentials: string) {
  const parsed = JSON.parse(credentials);
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key
      .replace(/-----BEGINPRIVATEKEY-----/g, '-----BEGIN PRIVATE KEY-----')
      .replace(/-----ENDPRIVATEKEY-----/g, '-----END PRIVATE KEY-----');
  }
  return parsed;
}

describe("Google Sheets API Connection", () => {
  it("should authenticate with Google Sheets API using service account", async () => {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Check if credentials are configured
    expect(credentials).toBeDefined();
    expect(spreadsheetId).toBeDefined();

    if (!credentials || !spreadsheetId) {
      throw new Error("Google credentials not configured");
    }

    // Parse and authenticate with fixed credentials
    const auth = new google.auth.GoogleAuth({
      credentials: fixCredentials(credentials),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Try to get spreadsheet metadata (lightweight call)
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties.title",
    });

    // Verify we got a response
    expect(response.data).toBeDefined();
    expect(response.data.properties?.title).toBeDefined();
    console.log("Connected to spreadsheet:", response.data.properties?.title);
  });

  it("should authenticate with Google Drive API using service account", async () => {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Check if credentials are configured
    expect(credentials).toBeDefined();
    expect(folderId).toBeDefined();

    if (!credentials || !folderId) {
      throw new Error("Google credentials not configured");
    }

    // Parse and authenticate with fixed credentials
    // Using broader scope to access shared folders
    const auth = new google.auth.GoogleAuth({
      credentials: fixCredentials(credentials),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Try to get folder metadata (lightweight call)
    const response = await drive.files.get({
      fileId: folderId,
      fields: "id,name",
    });

    // Verify we got a response
    expect(response.data).toBeDefined();
    expect(response.data.id).toBe(folderId);
    console.log("Connected to Drive folder:", response.data.name);
  });
});
