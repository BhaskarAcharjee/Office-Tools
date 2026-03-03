// ========================== CONSTANTS ==========================

const BASE_COLUMN_HEADERS = [
  "Item",
  "Name", // will be replaced dynamically per section
  "Code Input Identifier",
  "Description",
  "Type",
  "Mandatory/Optional/Display",
  "Max Length",
  "Domain Values / Validation / Remarks",
];

const SECTIONS = {
  HEADERS: "Request Headers",
  PATH_PARAMS: "Path Parameters",
  QUERY_PARAMS: "Query Parameters",
  REQUEST_BODY: "Request Body",
  RESPONSE_BODY: "Response Body",
};

// Custom label for the “Name” column depending on section
const NAME_LABELS = {
  [SECTIONS.HEADERS]: "Request Header Name",
  [SECTIONS.PATH_PARAMS]: "Path Parameter Name",
  [SECTIONS.QUERY_PARAMS]: "Query Parameter Name",
  [SECTIONS.REQUEST_BODY]: "Request Body Parameter",
  [SECTIONS.RESPONSE_BODY]: "Response Body Parameter",
};

// ========================== UTILITIES ==========================

function camelToNormal(str) {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ========================== UPDATED FLATTEN FUNCTION ==========================

function flattenJSON(obj, parentKey = "", result = [], startIndex = 1) {
  if (obj === null || obj === undefined) return result;

  // If it's an array, include it and process its elements
  if (Array.isArray(obj)) {
    const arrayKey = parentKey;
    result.push({
      item: result.length + startIndex,
      headerName: arrayKey.split(".").pop(),
      codeIdentifier: arrayKey,
      description: camelToNormal(arrayKey.split(".").pop()),
      type: "List",
      mandatory: "Mandatory",
      maxLength: "",
      domain: "",
    });

    // Recursively flatten all objects inside the array
    obj.forEach((element) => {
      if (typeof element === "object" && element !== null) {
        flattenJSON(element, arrayKey, result, startIndex);
      }
    });
    return result;
  }

  // Include parent object key before its children
  if (typeof obj === "object") {
    if (parentKey) {
      result.push({
        item: result.length + startIndex,
        headerName: parentKey.split(".").pop(),
        codeIdentifier: parentKey,
        description: camelToNormal(parentKey.split(".").pop()),
        type: "Object",
        mandatory: "Mandatory",
        maxLength: "",
        domain: "",
      });
    }

    for (const key in obj) {
      const value = obj[key];
      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      // Recursively flatten nested objects/arrays
      if (typeof value === "object" && value !== null) {
        flattenJSON(value, fullKey, result, startIndex);
      } else {
        result.push({
          item: result.length + startIndex,
          headerName: key,
          codeIdentifier: fullKey,
          description: camelToNormal(key),
          type: Array.isArray(value)
            ? "List"
            : typeof value === "number"
            ? "Double"
            : typeof value === "string"
            ? "String"
            : typeof value,
          mandatory: "Mandatory",
          maxLength: "",
          domain: "",
        });
      }
    }
  }

  return result;
}

// ========================== PARAMETER FIELD GENERATION ==========================

function createRow(container, placeholderLabel) {
  const div = document.createElement("div");
  div.className = "param-row";
  div.innerHTML = `
    <input placeholder="${placeholderLabel}" class="name" />
    <input placeholder="Code Identifier" class="code" />
    <input placeholder="Description" class="desc" />
    <select class="mandatory">
      <option>Mandatory</option>
      <option>Optional</option>
      <option>Display</option>
    </select>
    <input placeholder="Type" class="type" />
    <input placeholder="Max Length" class="max" />
    <input placeholder="Remarks" class="domain" />
    <button type="button" class="removeBtn">X</button>
  `;
  div.querySelector(".removeBtn").onclick = () => div.remove();
  container.appendChild(div);
}

const headersContainer = document.getElementById("headersContainer");
const pathContainer = document.getElementById("pathContainer");
const queryContainer = document.getElementById("queryContainer");

// Add a default header
function addDefaultHeader() {
  const div = document.createElement("div");
  div.className = "param-row";
  div.innerHTML = `
    <input value="X-Request-ID" class="name" />
    <input value="xRequestId" class="code" />
    <input value="API Request ID" class="desc" />
    <select class="mandatory">
      <option selected>Mandatory</option>
      <option>Optional</option>
      <option>Display</option>
    </select>
    <input value="String" class="type" />
    <input value="50" class="max" />
    <input value="Alpha Character UUID format" class="domain" />
    <button type="button" class="removeBtn">X</button>
  `;
  div.querySelector(".removeBtn").onclick = () => div.remove();
  headersContainer.appendChild(div);
}

addDefaultHeader();

document.getElementById("addHeaderBtn").onclick = () =>
  createRow(headersContainer, "Request Header Name");
document.getElementById("addPathBtn").onclick = () =>
  createRow(pathContainer, "Path Parameter Name");
document.getElementById("addQueryBtn").onclick = () =>
  createRow(queryContainer, "Query Parameter Name");

// ========================== DATA EXTRACTION ==========================

function getParamData(container) {
  const rows = container.querySelectorAll(".param-row");
  return Array.from(rows).map((r, i) => {
    const codeIdentifier = r.querySelector(".code").value.trim();
    let headerName = r.querySelector(".name").value.trim();
    if (!headerName && codeIdentifier)
      headerName = camelToNormal(codeIdentifier);
    return {
      item: i + 1,
      headerName,
      codeIdentifier,
      description: r.querySelector(".desc").value.trim(),
      type: r.querySelector(".type").value.trim(),
      mandatory: r.querySelector(".mandatory").value.trim(),
      maxLength: r.querySelector(".max").value.trim(),
      domain: r.querySelector(".domain").value.trim(),
    };
  });
}

// ========================== TABLE BUILDER ==========================

function buildTable(rows, sectionLabel) {
  if (!rows.length)
    return `<div class="no-data">No data available for ${sectionLabel}</div>`;

  const dynamicHeaders = [...BASE_COLUMN_HEADERS];
  dynamicHeaders[1] = NAME_LABELS[sectionLabel] || "Name";

  const cols = rows
    .map(
      (r) => `<tr>
        <td>${r.item}</td>
        <td>${r.headerName}</td>
        <td>${r.codeIdentifier}</td>
        <td>${r.description}</td>
        <td>${r.type}</td>
        <td>${r.mandatory}</td>
        <td>${r.maxLength}</td>
        <td>${r.domain}</td>
      </tr>`
    )
    .join("");

  return `
    <table class="modern-table">
      <thead><tr>${dynamicHeaders
        .map((h) => `<th>${h}</th>`)
        .join("")}</tr></thead>
      <tbody>${cols}</tbody>
    </table>
  `;
}

// ========================== PREVIEW GENERATOR ==========================

document.getElementById("previewBtn").addEventListener("click", () => {
  const name = svcName.value.trim();
  const desc = svcDesc.value.trim();
  const url = svcUrl.value.trim();
  const method = svcMethod.value;

  const headers = getParamData(headersContainer);
  const paths = getParamData(pathContainer);
  const queries = getParamData(queryContainer);

  // Skip request body if GET
  const reqBody =
    method === "GET" ? {} : JSON.parse(svcRequestBody.value || "{}");
  const resBody = JSON.parse(svcResponseBody.value || "{}");

  const flatReq = flattenJSON(reqBody, "", [], 1);
  const flatRes = flattenJSON(resBody, "", [], 1);

  let html = buildApiInfoCard({ name, desc, method, url });
  html += `<hr>`;

  html += `<h4>${SECTIONS.HEADERS}</h4>${buildTable(
    headers,
    SECTIONS.HEADERS
  )}`;
  html += `<h4>${SECTIONS.PATH_PARAMS}</h4>${buildTable(
    paths,
    SECTIONS.PATH_PARAMS
  )}`;
  html += `<h4>${SECTIONS.QUERY_PARAMS}</h4>${buildTable(
    queries,
    SECTIONS.QUERY_PARAMS
  )}`;

  if (method !== "GET") {
    html += `<h4>${SECTIONS.REQUEST_BODY}</h4>${buildTable(
      flatReq,
      SECTIONS.REQUEST_BODY
    )}`;
  }

  html += `<h4>${SECTIONS.RESPONSE_BODY}</h4>${buildTable(
    flatRes,
    SECTIONS.RESPONSE_BODY
  )}`;

  document.getElementById("previewOutput").innerHTML = html;
});

// ========================== MODERN API INFO CARD ==========================

function buildApiInfoCard({ name, desc, method, url }) {
  return `
    <div class="api-info-card">
      <div><strong>Service Name:</strong> ${name || "-"}</div>
      <div><strong>Description:</strong> ${desc || "-"}</div>
      <div><strong>Method:</strong> <span class="method-badge">${method}</span></div>
      <div><strong>URL:</strong> <code>${url || "-"}</code></div>
    </div>
  `;
}

// ========================== EXCEL EXPORT ==========================

document.getElementById("exportBtn").addEventListener("click", () => {
  const workbook = XLSX.utils.book_new();
  const sheetData = [];

  // Basic Info
  sheetData.push(["API Service Name", svcName.value]);
  sheetData.push(["API Service Description", svcDesc.value]);
  sheetData.push(["Method Type", svcMethod.value]);
  sheetData.push(["URL", svcUrl.value]);
  sheetData.push([]);

  // Parse safely
  let reqJSON = {};
  let resJSON = {};
  try {
    reqJSON = JSON.parse(svcRequestBody.value || "{}");
  } catch (e) {}
  try {
    resJSON = JSON.parse(svcResponseBody.value || "{}");
  } catch (e) {}

  const sections = [
    [SECTIONS.HEADERS, getParamData(headersContainer)],
    [SECTIONS.PATH_PARAMS, getParamData(pathContainer)],
    [SECTIONS.QUERY_PARAMS, getParamData(queryContainer)],
    [SECTIONS.REQUEST_BODY, flattenJSON(reqJSON)],
    [SECTIONS.RESPONSE_BODY, flattenJSON(resJSON)],
  ];

  sections.forEach(([title, data]) => {
    if (!data.length) return;
    sheetData.push([title]);
    sheetData.push(BASE_COLUMN_HEADERS);
    data.forEach((r) =>
      sheetData.push([
        r.item,
        r.headerName,
        r.codeIdentifier,
        r.description,
        r.type,
        r.mandatory,
        r.maxLength,
        r.domain,
      ])
    );
    sheetData.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto column width
  const colWidths = [];
  const maxCols = sheetData.reduce((max, row) => Math.max(max, row.length), 0);
  for (let c = 0; c < maxCols; c++) {
    let maxLen = 10;
    sheetData.forEach((r) => {
      if (r && r[c]) maxLen = Math.max(maxLen, String(r[c]).length);
    });
    colWidths.push({ wch: maxLen + 2 });
  }
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(workbook, ws, "API Spec");
  XLSX.writeFile(workbook, `${svcName.value || "API_Spec"}.xlsx`);
});
