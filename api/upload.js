export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { fileName, content, title, description } = req.body;

    const TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = "saikrishna1235";
    const REPO = "Photo_Studio";

    if (!TOKEN) {
      return res.status(500).json({ error: "Missing GitHub token" });
    }

    // 🔹 Upload image
    const uploadRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/images/${fileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Upload image",
          content: content,
        }),
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      console.error("Upload error:", uploadData);
      return res.status(500).json(uploadData);
    }

    // 🔹 Get data.json
    const fileRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/data.json`,
      {
        headers: {
          Authorization: `token ${TOKEN}`,
        },
      }
    );

    const file = await fileRes.json();

    if (!file.content) {
      console.error("JSON fetch error:", file);
      return res.status(500).json(file);
    }

    const current = JSON.parse(
      Buffer.from(file.content, "base64").toString()
    );

    // Ensure photos array exists
    if (!current.photos) {
      current.photos = [];
    }

    // 🔹 Add new photo
    current.photos.push({
      title,
      image: `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/images/${fileName}`,
      description,
    });

    // 🔹 Update JSON
    const updateRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/data.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Update JSON",
          content: Buffer.from(JSON.stringify(current, null, 2)).toString("base64"),
          sha: file.sha,
        }),
      }
    );

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      console.error("Update error:", updateData);
      return res.status(500).json(updateData);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
