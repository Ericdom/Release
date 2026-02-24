/**
 * Google Apps Script for "Into the Void" PWA
 * Handles submissions for "Waitlist" and "Feedback" sheets.
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this in.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select type "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone".
 * 8. Copy the Web App URL and update GOOGLE_SHEETS_WEBAPP_URL in index.html if it changed.
 */

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = e.parameter.sheet || "Waitlist";
    const sheet = doc.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput("Sheet not found").setMimeType(ContentService.MimeType.TEXT);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(function(h) {
      const header = h.toString().trim();
      return e.parameter[header] || "";
    });

    sheet.appendRow(newRow);

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
