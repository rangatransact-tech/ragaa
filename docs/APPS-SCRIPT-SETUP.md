# Apps Script setup (RSVPs and guest photos)

This runs free on a personal Google account; no Workspace needed. When you're done, you'll have:
- a Google Sheet with an **RSVP** tab (Received, Name, People, Invitation, Language) and a **Photos** tab (Received, File, File ID, Approved);
- a Drive folder that collects guest photos;
- a web-app URL to paste into `GAS_URL` in `public/js/config.js`.

Allow about 15 minutes.

## 1. Make the Drive folder

1. Go to https://drive.google.com and click **New → New folder**. Name it `RaGaa guest photos`.
2. Open the folder. Its address looks like `https://drive.google.com/drive/folders/1AbCdEf...`.
3. Copy the part after `/folders/`. That's the **folder ID**; you'll need it in step 3.

## 2. Make the Sheet and open Apps Script

1. Go to https://sheets.google.com and start a **Blank** spreadsheet. Name it `RaGaa RSVPs`.
2. In the menu, choose **Extensions → Apps Script**. A code editor opens in a new tab, already linked to this sheet.

## 3. Paste the code

1. In the editor, select everything in `Code.gs` and delete it.
2. Paste in the whole of `apps-script/Code.gs` from this project.
3. On the line `const PHOTO_FOLDER_ID = 'PASTE_FOLDER_ID_HERE';`, replace `PASTE_FOLDER_ID_HERE` with your folder ID. Keep the quotes.
4. Click the **Save** icon (the floppy disk).

## 4. Give it permission (one time)

1. In the toolbar, pick **testSetup** from the function drop-down, then click **Run**.
2. Google asks for authorisation. Click **Review permissions** and choose your account.
3. You'll see "Google hasn't verified this app". That's normal for your own script. Click **Advanced → Go to (project name) (unsafe)**, then **Allow**.
4. The log at the bottom should say `Photo folder: RaGaa guest photos`. Back in the sheet, you'll now see the **RSVP** and **Photos** tabs.

## 5. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Fill it in:
   - Description: `RaGaa v1`
   - Execute as: **Me**
   - Who has access: **Anyone** (not "Anyone with Google account"; guests aren't signed in)
4. Click **Deploy**, then copy the **Web app URL**. It ends in `/exec`.

## 6. Connect the website

1. In `public/js/config.js`, set:
   ```js
   export const GAS_URL = 'https://script.google.com/macros/s/AKfy.../exec';
   ```
2. Commit and push. Vercel redeploys on its own.

## 7. Test it

1. Open the site, scroll to **Will you join us?**, and send an RSVP with your own name. Within a few seconds a row appears in the **RSVP** tab.
2. In **Memories**, tap **Add photos** and pick a photo. A row appears in **Photos** with the **Approved** box unticked, and the file lands in the Drive folder.
3. Tick **Approved**, then reload the site. The photo appears on the wall. Untick it to hide it again.
4. To check the list directly, open `YOUR_URL?action=list` in a browser. You'll see `{"photos":[...]}` with only the approved ones.

## Changing the code later

After you edit `Code.gs`, choose **Deploy → Manage deployments → (pencil) Edit → Version: New version → Deploy**. That keeps the same URL, so you don't have to touch `GAS_URL`. If you choose "New deployment" instead, you get a new URL.

## Good to know

- **Moderation:** nothing shows on the wall until you tick **Approved**. Photos are shared as "anyone with the link can view", which the site needs to show them. The file IDs are only published once you approve a photo.
- **Limits:** a free account allows plenty for a wedding (about 20,000 URL calls a day and 6 minutes of script time per request). Each photo is resized on the guest's phone to at most 1600 px (usually 300–700 KB) before upload.
- **Guests can't read your sheet:** they only reach the two functions in the script.
- **Why `mode: "no-cors"`:** Apps Script replies through a redirect the browser can't read cross-origin. The site treats "the request left the phone" as success. That's why a genuinely bad connection shows the retry message, but a script error wouldn't. Test with step 7 after every change.
- **Removing a photo for good:** delete its row in **Photos** and its file in the Drive folder.
