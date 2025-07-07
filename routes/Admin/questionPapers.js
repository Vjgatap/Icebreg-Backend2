const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const Test = require("../../models/Admin/TestSeries"); // update path if needed

const router = express.Router();
const upload = multer(); // parses multipart/form-data

// Supabase init
const supabase = createClient(
  "https://dugvwcbevjwcqdbegsot.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Z3Z3Y2Jldmp3Y3FkYmVnc290Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg4NjkwNiwiZXhwIjoyMDYwNDYyOTA2fQ.pMXYwvQZDXxdg4L1zQpos02Sj_lzvqJQt_nxU5SzBD8" // not anon key for uploads
);

router.post("/", upload.single("fileUrl"), async (req, res) => {
  try {
    const { originalname, buffer } = req.file;
    const { title, examId, testSeriesId } = req.body;

    const fileName = `${Date.now()}_${originalname}`;
console.log(fileName, testSeriesId)
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
      });

    if (uploadError) {
        console.log("errr", uploadError)
      return res.status(500).json({ error: "Upload to Supabase failed", details: uploadError });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Update Test document in MongoDB by _id (testSeriesId)
    const updateResult = await Test.updateOne(
      { _id: testSeriesId },
      { $set: { url: publicUrl } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ error: "Test not found or not updated" });
    }

    return res.status(200).json({ message: "PDF uploaded and Test updated", url: publicUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
});

module.exports = router;
