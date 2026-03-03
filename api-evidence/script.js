let formData = {};

function generatePreview() {
  const serviceName = document.getElementById("serviceName").value;
  const url = document.getElementById("url").value;
  const endpoint = document.getElementById("endpoint").value;
  const jwtToken = document.getElementById("jwtToken").value;

  const postmanImg = document.getElementById("ssPostman").files[0];
  const uiImg = document.getElementById("ssUI").files[0];
  const dbImg = document.getElementById("ssDB").files[0];

  formData = {
    serviceName,
    url,
    endpoint,
    jwtToken,
    postmanImg,
    uiImg,
    dbImg,
  };

  const previewContainer = document.getElementById("previewContainer");
  previewContainer.style.display = "block";
  document.getElementById("exportBtn").style.display = "inline-block";

  let postmanURL = postmanImg ? URL.createObjectURL(postmanImg) : "";
  let uiURL = uiImg ? URL.createObjectURL(uiImg) : "";
  let dbURL = dbImg ? URL.createObjectURL(dbImg) : "";

  previewContainer.innerHTML = `
        <h2>API Evidence of - ${serviceName}</h2>
        <div class="section"><h3>Service Name:</h3><p>${serviceName}</p></div>
        <div class="section"><h3>URL:</h3><p>${url}</p></div>
        <div class="section"><h3>Endpoint:</h3><p>${endpoint}</p></div>
        <div class="section"><h3>JWT Token:</h3><p>${jwtToken || "N/A"}</p></div>
        ${postmanURL ? `<div class="section"><h3>Postman Evidence:</h3><img src="${postmanURL}" alt="Postman Evidence"></div>` : ""}
        ${uiURL ? `<div class="section"><h3>Front Office (UI) Match:</h3><img src="${uiURL}" alt="UI Match"></div>` : ""}
        ${dbURL ? `<div class="section"><h3>Database Evidence:</h3><img src="${dbURL}" alt="Database Evidence"></div>` : ""}
      `;
}

async function exportWord() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Media } =
    window.docx;

  const docChildren = [
    new Paragraph({
      text: `API Evidence of - ${formData.serviceName}`,
      heading: HeadingLevel.HEADING_1,
      alignment: "center",
    }),
    new Paragraph(""),
    new Paragraph({ text: "Service Name:", bold: true }),
    new Paragraph(formData.serviceName),
    new Paragraph({ text: "URL:", bold: true }),
    new Paragraph(formData.url),
    new Paragraph({ text: "Endpoint:", bold: true }),
    new Paragraph(formData.endpoint),
    new Paragraph({ text: "JWT Token:", bold: true }),
    new Paragraph(formData.jwtToken || "N/A"),
  ];

  // Function to handle image
  async function addImage(file, label) {
    if (!file) return;
    const imgBase64 = await fileToBase64(file);
    const image = Media.addImage(doc, dataURLToBlob(imgBase64));
    docChildren.push(new Paragraph({ text: label, bold: true }));
    docChildren.push(new Paragraph(image));
  }

  const doc = new Document({
    sections: [{ properties: {}, children: docChildren }],
  });

  if (formData.postmanImg) {
    const imgBase64 = await fileToBase64(formData.postmanImg);
    const image = Media.addImage(doc, dataURLToBlob(imgBase64));
    docChildren.push(new Paragraph({ text: "Postman Evidence:", bold: true }));
    docChildren.push(new Paragraph(image));
  }

  if (formData.uiImg) {
    const imgBase64 = await fileToBase64(formData.uiImg);
    const image = Media.addImage(doc, dataURLToBlob(imgBase64));
    docChildren.push(
      new Paragraph({ text: "Front Office (UI) Match:", bold: true }),
    );
    docChildren.push(new Paragraph(image));
  }

  if (formData.dbImg) {
    const imgBase64 = await fileToBase64(formData.dbImg);
    const image = Media.addImage(doc, dataURLToBlob(imgBase64));
    docChildren.push(new Paragraph({ text: "Database Evidence:", bold: true }));
    docChildren.push(new Paragraph(image));
  }

  const blob = await Packer.toBlob(doc);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${formData.serviceName}_API_Evidence.docx`;
  link.click();
}

// Helpers
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

function dataURLToBlob(dataURL) {
  const byteString = atob(dataURL.split(",")[1]);
  const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
