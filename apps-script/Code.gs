/**
 * RaGaa backend: RSVPs and guest photos, on a free personal Google account.
 * Deploy as a web app (Execute as: Me, Who has access: Anyone).
 * Setup steps: docs/APPS-SCRIPT-SETUP.md
 */

// Paste the ID of the Drive folder for guest photos (from its URL:
// https://drive.google.com/drive/folders/THIS_PART).
const PHOTO_FOLDER_ID = 'PASTE_FOLDER_ID_HERE';

const RSVP_SHEET = 'RSVP';
const PHOTO_SHEET = 'Photos';
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.type === 'rsvp') return saveRsvp_(body);
    if (body.type === 'photo') return savePhoto_(body);
    return json_({ ok: false, error: 'unknown type' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'list') return listPhotos_();
  return json_({ ok: true });
}

function saveRsvp_(b) {
  const sheet = sheet_(RSVP_SHEET, ['Received', 'Name', 'People', 'Invitation', 'Language']);
  const name = clean_(b.name, 80);
  const people = Math.max(1, Math.min(20, parseInt(b.people, 10) || 1));
  const invite = b.invite === 'wedding' ? 'wedding' : 'full';
  const lang = ['en', 'te', 'ta'].indexOf(b.lang) >= 0 ? b.lang : 'en';
  if (!name) return json_({ ok: false, error: 'name required' });
  sheet.appendRow([new Date(), name, people, invite, lang]);
  return json_({ ok: true });
}

function savePhoto_(b) {
  const bytes = Utilities.base64Decode(String(b.data || ''));
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) return json_({ ok: false, error: 'bad size' });
  const stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd-HHmmss');
  const blob = Utilities.newBlob(bytes, 'image/jpeg', stamp + '-' + clean_(b.name, 60).replace(/[^\w.-]+/g, '_'));
  const file = DriveApp.getFolderById(PHOTO_FOLDER_ID).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const sheet = sheet_(PHOTO_SHEET, ['Received', 'File', 'File ID', 'Approved']);
  sheet.appendRow([new Date(), file.getName(), file.getId(), false]);
  // Approved is a checkbox, unticked: nothing shows on the site until you tick it.
  sheet.getRange(sheet.getLastRow(), 4).insertCheckboxes();
  return json_({ ok: true });
}

function listPhotos_() {
  const sheet = sheet_(PHOTO_SHEET, ['Received', 'File', 'File ID', 'Approved']);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues() : [];
  const photos = rows
    .filter(function (r) { return r[3] === true && r[2]; })
    .reverse()
    .map(function (r) { return { url: 'https://drive.google.com/thumbnail?id=' + r[2] + '&sz=w1000' }; });
  return json_({ photos: photos });
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

function clean_(s, max) {
  // strip leading = + - @ so a name can never run as a spreadsheet formula
  return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().replace(/^[=+\-@]+/, '').slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor to grant Drive + Sheets permissions and check the folder ID.
function testSetup() {
  sheet_(RSVP_SHEET, ['Received', 'Name', 'People', 'Invitation', 'Language']);
  sheet_(PHOTO_SHEET, ['Received', 'File', 'File ID', 'Approved']);
  Logger.log('Photo folder: ' + DriveApp.getFolderById(PHOTO_FOLDER_ID).getName());
}
