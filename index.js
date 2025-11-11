import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

//connect postgress database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Trnghi88",
  port: 5432
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//function to check visited countries code
async function checkVisited() {
  const result = await db.query("SELECT UPPER(country_code) AS country_code FROM visited_countries");
  //another way to return the list of country code
  
  let countries = [];
  result.rows.forEach((id) => {
    countries.push(id.country_code);
  });
  return countries;
  
  //return result.rows.map(row => row.country_code); //shorter way to return country code
}

//function to get all country names for the autocomplete list
async function getAllCountries() {
  const result = await db.query("SELECT TRIM(LOWER(country_name)) as country_name FROM countries ORDER BY country_name ASC");
  return result.rows.map(row => row.country_name);
}

// GET home page
app.get("/", async (req, res) => {
  const countries = await checkVisited();
  const allCountryNames = await getAllCountries(); 
  res.render("index.ejs", {
    countries: countries, 
    total: countries.length,
    allCountryNames: allCountryNames,
  });
});

//INSERT new country
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query( "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'" ,[input.toLowerCase()]);
    const data = result.rows[0];
    const countryCode = data.country_code;  
    try {
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisited();
      const allCountryNames = await getAllCountries(); 
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        allCountryNames: allCountryNames,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisited();
    const allCountryNames = await getAllCountries(); 
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      allCountryNames: allCountryNames,
      error: "Country name does not exist, try again",
    });
  }
  
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
