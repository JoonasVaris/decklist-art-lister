function getDecklistToArray(raw) {
  const decklist = [];
  raw.split("\n").forEach((row) => {
    decklist.push(row.replace(/^\d+\s/, ""));
  });
  return decklist;
}

function getDecklist(id) {
  const deck = getDecklistToArray(document.getElementById(id).value);
  return deck;
}

function getFoilCondition() {
  const foil = document.querySelector("#foil")?.checked;
  const nonFoil = document.querySelector("#nonfoil")?.checked;

  if (foil && nonFoil) {
    return "";
  } else if (foil) {
    return "+is%3Afoil";
  } else if (nonFoil) {
    return "+is%3Anonfoil";
  } else {
    return "";
  }
}

const basics = ["mountain", "swamp", "forest", "plains", "island"];

function main() {
  const decklist = getDecklist("deck1");
  decklist.forEach(async (card, index) => {
    setTimeout(async () => {
      const skipBasics = document.querySelector("#basics")?.checked;
      if (skipBasics && basics.includes(card.toLowerCase())) {
        return;
      }

      const res = await fetch(
        `https://api.scryfall.com/cards/search?order=released&q=%21%22${card.replace(
          /\s/g,
          "+"
        )}%22+include%3Aextras+game%3Apaper+-is%3Aoversized+legal%3Avintage${getFoilCondition()}&unique=prints`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        const cardRowWrapper = document.createElement("div");
        cardRowWrapper.className = "card-row-wrapper";
        const wrapper = document.createElement("div");
        const notFound = document.createElement("span");
        notFound.className = "not-found";
        notFound.innerHTML = `${card} not found, check for typos`;

        wrapper.appendChild(notFound);
        cardRowWrapper.appendChild(wrapper);

        document.getElementById("results").appendChild(cardRowWrapper);
        return;
      }
      const cardData = await res.json();

      const cardRowWrapper = document.createElement("div");
      cardRowWrapper.className = "card-row-wrapper";
      cardData.data.forEach((card) => {
        const cardWrapper = document.createElement("div");
        cardWrapper.className = "card";

        const image = document.createElement("div");
        image.className = "image";
        if (card?.card_faces) {
          image.style.backgroundImage = `url(${card.card_faces[0].image_uris.small})`;
        } else {
          image.style.backgroundImage = `url(${card.image_uris.small})`;
        }

        const set = document.createElement("span");
        set.className = "set";
        set.innerHTML = card.set_name;

        const finishes = document.createElement("span");
        finishes.className = "finishes";
        finishes.innerHTML = card.finishes.join(",");

        const prices = document.createElement("span");
        prices.className = "prices";
        prices.innerHTML = `${card.prices.eur ?? "[--]"} ${
          card.prices.eur_foil ?? "[--]"
        }`;

        if (card.purchase_uris?.cardmarket) {
          const cmLink = document.createElement("a");
          cmLink.href = card.purchase_uris?.cardmarket;
          cmLink.innerText = "cm";
          prices.appendChild(cmLink);
        }

        cardWrapper.appendChild(set);
        cardWrapper.appendChild(finishes);
        cardWrapper.appendChild(prices);
        cardWrapper.appendChild(image);
        cardRowWrapper.appendChild(cardWrapper);
      });
      document.getElementById("results").appendChild(cardRowWrapper);
    }, 100 * index);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const fetchButton = document.getElementById("fetch");
  const handler = () => {
    // first remove any previous results
    const wrapper = document.getElementById("results");
    wrapper.innerHTML = "";
    main();
  };
  fetchButton.addEventListener("click", handler);
});
