import { describe, expect, it } from "vitest";
import { v2 as cloudinary } from "cloudinary";

describe("Cloudinary API Connection", () => {
  it("should authenticate with Cloudinary API using credentials", async () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if credentials are configured
    expect(cloudName).toBeTruthy();
    expect(apiKey).toBeTruthy();
    expect(apiSecret).toBeTruthy();

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Test connection by pinging the API (get account usage)
    const result = await cloudinary.api.ping();
    
    console.log("Cloudinary connection successful:", result.status);
    expect(result.status).toBe("ok");
  }, 15000); // 15 second timeout
});
