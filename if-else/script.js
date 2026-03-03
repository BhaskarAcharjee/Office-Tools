// Initial dummy data
document.getElementById("codeInput").value = `if(condition1){
    if(condition2){
        setHHJJAutoPan(true);
    } else {
        setOjtjther(false);
    }
} 

if(condition1){
    if(condition2){
        setAutoPan(true);
    } else {
        setOther(false);
    }
} else if(condition3){
    setSomething();
} else {
    setAutoPan(false);
}`;

function execute() {
  const code = document.getElementById("codeInput").value;
  const rawKeywords = document.getElementById("keywordsInput").value;
  const isCaseSensitive = document.getElementById("caseSensitive").checked;
  const matchMode = document.getElementById("matchMode").value;

  const keywords = rawKeywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k !== "");

  if (keywords.length === 0) {
    document.getElementById("output").textContent =
      "Please enter at least one keyword.";
    return;
  }

  // 1. Split into Logical Chains
  const chains = getLogicalChains(code);

  // 2. Filter Chains based on Match All / Match Any
  const filteredChains = chains.filter((chain) => {
    if (matchMode === "all") {
      return keywords.every((kw) => contains(chain, kw, isCaseSensitive));
    }
    return keywords.some((kw) => contains(chain, kw, isCaseSensitive));
  });

  // 3. Process internals of kept chains
  const finalOutput = filteredChains
    .map((chain) => processBlockRecursive(chain, keywords, isCaseSensitive))
    .join("\n\n")
    .trim();

  document.getElementById("output").textContent = finalOutput;
  updateStats(finalOutput, keywords, isCaseSensitive);
}

function contains(text, search, caseSensitive) {
  if (!caseSensitive) {
    return text.toLowerCase().includes(search.toLowerCase());
  }
  return text.includes(search);
}

function getLogicalChains(code) {
  const chains = [];
  let i = 0;
  while (i < code.length) {
    let start = code.indexOf("if", i);
    if (start === -1) break;

    // Simple check to ensure we aren't mid-word
    const prevChar = code[start - 1];
    if (prevChar && /[a-zA-Z0-9_]/.test(prevChar)) {
      i = start + 2;
      continue;
    }

    let currentChainEnd = findBlockEnd(code, start);

    while (true) {
      let nextPart = code.substring(currentChainEnd).trimStart();
      if (nextPart.startsWith("else")) {
        let elseStart = code.indexOf("else", currentChainEnd);
        currentChainEnd = findBlockEnd(code, elseStart);
      } else {
        break;
      }
    }
    chains.push(code.substring(start, currentChainEnd));
    i = currentChainEnd;
  }
  return chains;
}

function findBlockEnd(text, startIdx) {
  let firstBrace = text.indexOf("{", startIdx);
  if (firstBrace === -1) return text.indexOf(";", startIdx) + 1;
  let count = 1,
    j = firstBrace + 1;
  while (count > 0 && j < text.length) {
    if (text[j] === "{") count++;
    if (text[j] === "}") count--;
    j++;
  }
  return j;
}

function processBlockRecursive(code, keywords, isCaseSensitive) {
  let result = "";
  let i = 0;
  while (i < code.length) {
    let openBraceIndex = code.indexOf("{", i);
    if (openBraceIndex === -1) {
      result += filterLines(code.substring(i), keywords, isCaseSensitive);
      break;
    }

    let header = code.substring(i, openBraceIndex);
    let j = openBraceIndex + 1,
      count = 1;
    while (count > 0 && j < code.length) {
      if (code[j] === "{") count++;
      if (code[j] === "}") count--;
      j++;
    }
    let body = code.substring(openBraceIndex + 1, j - 1);

    const hasAnyKeyword = keywords.some((kw) =>
      contains(body, kw, isCaseSensitive),
    );

    if (hasAnyKeyword) {
      result +=
        header +
        "{" +
        processBlockRecursive(body, keywords, isCaseSensitive) +
        "}";
    } else {
      result += header + "{\n    }";
    }
    i = j;
  }
  return result;
}

function filterLines(text, keywords, isCaseSensitive) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (keywords.some((kw) => contains(line, kw, isCaseSensitive)))
        return line;
      if (
        trimmed.startsWith("if") ||
        trimmed.startsWith("else") ||
        trimmed === "" ||
        trimmed === "}"
      )
        return line;
      return "";
    })
    .join("\n");
}

function updateStats(text, keywords, isCaseSensitive) {
  let html = `<div style="margin-bottom:10px">Total Chains: ${getLogicalChains(text).length}</div>`;
  keywords.forEach((kw) => {
    const regex = new RegExp(
      kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
      isCaseSensitive ? "g" : "gi",
    );
    const count = (text.match(regex) || []).length;
    html += `<div><span class="badge">${kw}</span>: ${count} found</div>`;
  });
  document.getElementById("statsContent").innerHTML = html;
}
