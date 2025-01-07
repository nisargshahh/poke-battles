const typeColors = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

let pokemonList = [];
let searchTimeouts = {};
let currentPokemonData = { 1: null, 2: null };

// Fetch Pokemon list on load
fetch("https://pokeapi.co/api/v2/pokemon?limit=1000")
  .then((response) => response.json())
  .then((data) => {
    pokemonList = data.results.map((pokemon) => pokemon.name);
  });

function calculateStats(baseStat, level) {
  return Math.floor((2 * baseStat * level) / 100 + 5);
}

function createPokemonCard(data, cardElement, level) {
  const statsMax = {
    hp: 255,
    attack: 190,
    defense: 230,
    "special-attack": 194,
    "special-defense": 230,
    speed: 180,
  };

  const adjustedStats = data.stats.map((stat) => ({
    ...stat,
    adjusted_stat: calculateStats(stat.base_stat, level),
  }));

  cardElement.innerHTML = `
        <img src="${
          data.sprites.other["official-artwork"].front_default
        }" alt="${data.name}">
        <h2>${data.name} (Level ${level})</h2>
        <div class="types-container">
            ${data.types
              .map(
                (type) => `
                <span class="type" style="background-color: ${
                  typeColors[type.type.name]
                }">
                    ${type.type.name}
                </span>
            `
              )
              .join("")}
        </div>
        <div class="pokemon-stats">
            ${adjustedStats
              .map(
                (stat) => `
                <div class="stat-label">
                    <span>${stat.stat.name}</span>
                    <span>${stat.adjusted_stat}</span>
                </div>
                <div class="stats-bar">
                    <div class="stats-fill" style="width: ${
                      (stat.adjusted_stat / (statsMax[stat.stat.name] * 2)) *
                      100
                    }%"></div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
  cardElement.style.display = "block";
}

function updateLevel(side) {
  const level = document.getElementById(`levelSlider${side}`).value;
  document.getElementById(`levelDisplay${side}`).textContent = level;

  if (currentPokemonData[side]) {
    createPokemonCard(
      currentPokemonData[side],
      document.getElementById(`pokemonCard${side}`),
      level
    );
  }
}

async function searchPokemon(side) {
  const input = document.querySelector(
    `.pokemon-search[data-side="${side}"]`
  ).value;
  const error = document.getElementById(`error${side}`);
  const card = document.getElementById(`pokemonCard${side}`);
  const level = document.getElementById(`levelSlider${side}`).value;

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${input.toLowerCase()}`
    );
    if (!response.ok) throw new Error("Pokemon not found");

    const data = await response.json();
    currentPokemonData[side] = data;
    createPokemonCard(data, card, level);
    error.style.display = "none";
  } catch (err) {
    error.style.display = "block";
    card.style.display = "none";
  }
}

function showSuggestions(input, suggestions) {
  const filteredPokemon = pokemonList
    .filter((pokemon) => pokemon.includes(input.toLowerCase()))
    .slice(0, 5);

  suggestions.innerHTML = filteredPokemon
    .map(
      (pokemon) => `
        <div class="suggestion-item">${pokemon}</div>
    `
    )
    .join("");

  suggestions.style.display = filteredPokemon.length > 0 ? "block" : "none";
}

document.querySelectorAll(".pokemon-search").forEach((input) => {
  const side = input.dataset.side;
  const suggestions = document.getElementById(`suggestions${side}`);

  input.addEventListener("input", (e) => {
    clearTimeout(searchTimeouts[side]);
    searchTimeouts[side] = setTimeout(() => {
      showSuggestions(e.target.value, suggestions);
    }, 300);
  });

  input.addEventListener("focus", () => {
    if (input.value) {
      showSuggestions(input.value, suggestions);
    }
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchPokemon(side);
    }
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.style.display = "none";
    }
  });
});

// Event delegation for suggestions
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("suggestion-item")) {
    const searchInput = e.target
      .closest(".pokemon-side")
      .querySelector(".pokemon-search");
    const side = searchInput.dataset.side;
    const pokemonName = e.target.textContent;

    searchInput.value = pokemonName;
    document.getElementById(`suggestions${side}`).style.display = "none";
    searchPokemon(side);
  }
});

async function simulateBattle() {
  const side1 = {
    pokemon: currentPokemonData[1],
    level: parseInt(document.getElementById("levelSlider1").value),
  };

  const side2 = {
    pokemon: currentPokemonData[2],
    level: parseInt(document.getElementById("levelSlider2").value),
  };

  if (!side1.pokemon || !side2.pokemon) {
    alert("Please select both Pokemon before battling!");
    return;
  }

  // Show battle arena and loading status
  const battleArena = document.getElementById("battleArena");
  const battleStatus = document.getElementById("battleStatus");
  const loadingDiv = battleStatus.querySelector(".loading");

  battleArena.style.display = "block";
  loadingDiv.style.display = "block";
  battleStatus.style.display = "block";

  //   const baseURL =
  //     process.env.NODE_ENV === "production"
  //       ? "https://poke-battles.vercel.app/"
  //       : "http://localhost:3000/";

  try {
    const response = await fetch(
      `https://poke-battles.vercel.app/simulate-battle`,
      {
        // change the link to localhost:3000 during dev.
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pokemon1: side1.pokemon,
          pokemon2: side2.pokemon,
          level1: side1.level,
          level2: side2.level,
        }),
      }
    );

    const battleData = await response.json();
    const themeEmojis = ["⚡", "🔥", "💫", "🌟", "⚔️", "🛡️", "🎯", "💥"];
    const randomEmojis = () =>
      themeEmojis[Math.floor(Math.random() * themeEmojis.length)];
    const battleTheme = `${randomEmojis()} Epic Battle: ${side1.pokemon.name.toUpperCase()} vs ${side2.pokemon.name.toUpperCase()} ${randomEmojis()}`;

    // Update the UI with battle results
    document.getElementById("battleTheme").textContent = battleTheme;
    document.getElementById("battleNarrative").innerHTML = battleData.battle
      .replace(/\*\*/g, "") // Remove markdown bold
      .replace(/\*/g, "") // Remove markdown italic
      .replace(/Turn \d+:/g, (match) => `💥 ${match}`) // Add emoji to turns
      .replace(/Critical hit!/g, "⚡ Critical hit! ⚡")
      .replace(/wins the battle!/g, "🏆 wins the battle! 🎉")
      .replace(/\n/g, "<br>"); // Convert newlines to HTML breaks

    // loadingDiv.style.display = 'none';
  } catch (error) {
    console.error("Battle simulation error:", error);
    battleStatus.innerHTML = "❌ Failed to simulate battle. Please try again.";
  }
}

