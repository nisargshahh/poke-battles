// battleSimulator.js
const { Cerebras } = require("@cerebras/cerebras_cloud_sdk");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());

// Increase the payload size limit to 50mb
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

// Helper function to format Pokemon data for battle (simplified to reduce payload size)
function formatPokemonForBattle(pokemon, level) {
  return {
    name: pokemon.name,
    level: level,
    types: pokemon.types.map((t) => t.type.name),
    stats: pokemon.stats.reduce((acc, stat) => {
      acc[stat.stat.name] = calculateStats(stat.base_stat, level);
      return acc;
    }, {}),
    // Only get 4 random moves instead of all moves
    moves: pokemon.moves
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .map((m) => m.move.name),
  };
}

// Calculate level-adjusted stats
function calculateStats(baseStat, level) {
  return Math.floor((2 * baseStat * level) / 100 + 5);
}

// Update the generateBattlePrompt function in battleSimulator.js

function generateBattlePrompt(pokemon1, pokemon2) {
  return `Simulate an exciting Pokemon battle between:

Level ${pokemon1.level} ${pokemon1.name.toUpperCase()} (${pokemon1.types.join(
    "/"
  )}-type)
Stats: HP ${pokemon1.stats.hp}, Attack ${pokemon1.stats.attack}, Defense ${
    pokemon1.stats.defense
  }
Special Attack ${pokemon1.stats["special-attack"]}, Special Defense ${
    pokemon1.stats["special-defense"]
  }, Speed ${pokemon1.stats.speed}
Moves: ${pokemon1.moves.join(", ")}

VS

Level ${pokemon2.level} ${pokemon2.name.toUpperCase()} (${pokemon2.types.join(
    "/"
  )}-type)
Stats: HP ${pokemon2.stats.hp}, Attack ${pokemon2.stats.attack}, Defense ${
    pokemon2.stats.defense
  }
Special Attack ${pokemon2.stats["special-attack"]}, Special Defense ${
    pokemon2.stats["special-defense"]
  }, Speed ${pokemon2.stats.speed}
Moves: ${pokemon2.moves.join(", ")}

Create an exciting battle narrative with these elements:
1. Use "Turn X:" format for each turn
2. Include type advantages and critical hits
3. Add dramatic moments and environmental effects
4. Include crowd reactions and battle atmosphere
5. Make moves dynamic and impactful
6. Keep the narrative engaging and action-packed
7. End with a clear winner

Format guidelines:
- No markdown formatting
- Use clear turn numbers
- Mention "Critical hit!" for critical hits
- End with "[Pokemon Name] wins the battle!"
- Keep paragraphs short and impactful
- Include status effects and strategic moves

Make it exciting and detailed!`;
}

app.post("/simulate-battle", async (req, res) => {
  try {
    const { pokemon1, pokemon2, level1, level2 } = req.body;

    // Format Pokemon data
    const formattedPokemon1 = formatPokemonForBattle(pokemon1, level1);
    const formattedPokemon2 = formatPokemonForBattle(pokemon2, level2);

    // Generate battle prompt
    const battlePrompt = generateBattlePrompt(
      formattedPokemon1,
      formattedPokemon2
    );

    console.log(
      "Simulating battle between:",
      formattedPokemon1.name,
      "and",
      formattedPokemon2.name
    );

    // Make API call to Cerebras
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: battlePrompt }],
      model: "llama3.1-8b",
    });

    // Send battle narrative back to client
    res.json({
      battle: completion.choices[0].message.content,
      pokemon1: formattedPokemon1,
      pokemon2: formattedPokemon2,
    });
  } catch (error) {
    console.error("Battle simulation error:", error);
    res
      .status(500)
      .json({ error: "Failed to simulate battle", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Battle simulator running on port ${PORT}`);
});
