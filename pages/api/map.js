export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).send();

    const { circuit } = req.query;
    if (!circuit) return res.status(400).send("circuit missing");

    const apiResponse = await fetch(
      `https://api.multiviewer.app/api/v1/circuits/${circuit}/${new Date().getFullYear()}`,
      {
        headers: {
          "User-Agent": "tdjsnelling/monaco",
        },
      }
    );
    if (apiResponse.status !== 200)
      return res.status(apiResponse.status).send();
    const data = await apiResponse.json();

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).send(e.message);
  }
}
