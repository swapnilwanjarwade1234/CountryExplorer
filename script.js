
const searchForm = document.getElementById("searchForm");
const countryInput = document.getElementById("countryInput");
const results = document.getElementById("results");
const statusText = document.getElementById("status");
const recentSearches = document.getElementById("recentSearches");
const themeBtn = document.getElementById("themeBtn");

let recent = [];

try {
  const saved = JSON.parse(localStorage.getItem("recentCountries"));
  if (Array.isArray(saved)) {
    recent = saved.filter(item => typeof item === "string").slice(0, 5);
  }
} catch {
  recent = [];
}

function formatNumber(number) {
  return new Intl.NumberFormat().format(number || 0);
}

function renderRecentSearches() {
  recentSearches.replaceChildren();

  recent.forEach(country => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = country;

    button.addEventListener("click", () => {
      countryInput.value = country;
      searchCountry(country);
    });

    recentSearches.appendChild(button);
  });
}

function saveRecentSearch(country) {
  recent = [
    country,
    ...recent.filter(
      item => item.toLowerCase() !== country.toLowerCase()
    )
  ].slice(0, 5);

  try {
    localStorage.setItem("recentCountries", JSON.stringify(recent));
  } catch {
    // The search still works if browser storage is unavailable.
  }

  renderRecentSearches();
}

function displayCountry(country) {
  const card = document.createElement("article");
  card.className = "country-card";

  const flag = document.createElement("img");
  flag.src = country.flags?.svg || country.flags?.png || "";
  flag.alt = `Flag of ${country.name}`;
  flag.loading = "lazy";

  if (!flag.src) {
    flag.alt = country.flag || "Country flag unavailable";
  }

  const info = document.createElement("div");
  info.className = "country-info";

  const heading = document.createElement("h2");
  heading.textContent = country.name || "Unknown country";

  const official = document.createElement("p");
  official.textContent =
    "Official name: " + (country.officialName || country.name || "Not available");

  const capital = document.createElement("p");
  capital.textContent =
    "Capital: " + (country.capital || "Not available");

  const population = document.createElement("p");
  population.textContent =
    "Population: " + formatNumber(country.population);

  const region = document.createElement("p");
  region.textContent =
    "Region: " + (country.region || "Not available");

  const languages = document.createElement("p");
  languages.textContent =
    "Languages: " +
    (Array.isArray(country.languages)
      ? country.languages.map(item =>
          typeof item === "string" ? item : item.name
        ).filter(Boolean).join(", ")
      : "Not available");

  const currencies = document.createElement("p");
  currencies.textContent =
    "Currencies: " +
    (Array.isArray(country.currencies)
      ? country.currencies.map(item =>
          `${item.name || item.code || "Currency"} (${item.symbol || "no symbol"})`
        ).join(", ")
      : "Not available");

  info.append(
    heading,
    official,
    capital,
    population,
    region,
    languages,
    currencies
  );

  card.append(flag, info);
  results.appendChild(card);
}

async function searchCountry(searchName) {
  const name = searchName.trim();

  if (name.length < 2) {
    statusText.textContent = "Please enter at least two characters.";
    return;
  }

  results.replaceChildren();
  statusText.textContent = "Loading country information...";

  try {
    const url =
      "https://countries.dev/name/" + encodeURIComponent(name);

    const response = await fetch(url);

    if (response.status === 404) {
      throw new Error("Country not found. Check the spelling and try again.");
    }

    if (!response.ok) {
      throw new Error(
        `Country service returned error ${response.status}. Please try again.`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No matching country was found.");
    }

    data.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

    data.forEach(displayCountry);

    statusText.textContent =
      `Found ${data.length} matching country/countries.`;

    saveRecentSearch(name);
  } catch (error) {
    results.replaceChildren();

    if (error instanceof TypeError) {
      statusText.textContent =
        "Network error: check your internet connection or try again later.";
    } else {
      statusText.textContent =
        error.message || "Something went wrong. Please try again.";
    }

    console.error("Country Explorer error:", error);
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  searchCountry(countryInput.value);
});

function setTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

let savedTheme = "light";

try {
  savedTheme = localStorage.getItem("countryTheme") || "light";
} catch {
  // Use light theme if browser storage is unavailable.
}

setTheme(savedTheme === "dark");

themeBtn.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark");
  setTheme(isDark);

  try {
    localStorage.setItem("countryTheme", isDark ? "dark" : "light");
  } catch {
    // Theme still changes for the current page session.
  }
});

renderRecentSearches();
