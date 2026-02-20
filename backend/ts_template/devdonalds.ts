import express, { Request, Response } from "express";
import { parse } from "path";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: cookbookEntry[] = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  let parsed = recipeName.replace(/[\s\-_]+/g, " ");
  parsed = parsed.replace(/[^A-Za-z\s]/g, "");
  let split_name = parsed.split(" ")
                    .filter(str => str.length > 0)
                    .map(str => str.toLowerCase())
                    .map(str => str[0].toUpperCase() + str.slice(1));

  parsed = split_name.join(" ");
  if (parsed.length === 0) return null;
    
  return parsed;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const entry = req.body;

  if (entry.type !== "recipe" && entry.type !== "ingredient") {
    return res.status(400).send("Invalid type.");
  }

  if (entry.cookTime instanceof Number || entry.cookTime === null || entry.cookTime < 0) {
    return res.status(400).send("Invalid cook time.");
  }

  if (cookbook.find(e => e.name === entry.name)) {
    return res.status(400).send("Entry name must be unique.");
  }

  let requiredItems: (ingredient | recipe)[] = entry.requiredItems;
  if (requiredItems) {
    let requiredSet = new Set<string>(requiredItems.map(item => item.name));
    if (requiredSet.size !== requiredItems.length) {
      return res.status(400).send("Required items must only have one element per name.");
    }
  }

  cookbook.push(entry);
  res.status(200).send("Entry has been added to cookbook successfully!");
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const recipeName = req.query.name;

  const entry = cookbook.find(r => r.name === recipeName);
  if (!entry || entry.type !== "recipe") {
    return res.status(400).send("Invalid recipe.");
  }

  let recipeRes = {
    "name": recipeName,
    "cookTime": 0,
    "ingredients": []
  };

  if (summarise((entry as recipe).requiredItems, 1, recipeRes)) {
    return res.status(200).json(recipeRes);
  } else {
    return res.status(400).send("Invalid.");
  }
});

const summarise = (requirements: requiredItem[], numItems: number, recipeRes) => {
  for (let reqItem of requirements) {
    const item = cookbook.find(r => r.name === reqItem.name);
    if (!item) {
      return false;
    }

    if (item.type === "ingredient") {
      recipeRes.cookTime += (item as ingredient).cookTime * reqItem.quantity * numItems;
      const ingredient = recipeRes.ingredients.find(i => i.name === item.name);
      if (!ingredient) {
        recipeRes.ingredients.push({
          "name": item.name,
          "quantity": reqItem.quantity * numItems
        });
      } else {
        ingredient.quantity += reqItem.quantity * numItems;
      }
    } else {
      if (!summarise((item as recipe).requiredItems, reqItem.quantity, recipeRes)) return false;
    }
  }

  return true;
};

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
