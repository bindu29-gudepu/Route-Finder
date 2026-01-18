const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send");

function addMsg(text, who = "user") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addBot(text) { addMsg(text, "bot"); }
function addUser(text) { addMsg(text, "user"); }

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  addUser(text);
  input.value = "";

  // Extract preference if present in parentheses
  let preference = "fastest";
  const prefMatch = text.match(/\((fastest|cheapest|fewest stops)\)/i);
  if (prefMatch) {
    const raw = prefMatch[1].toLowerCase();
    preference = raw.replace(" ", "_"); // "fewest stops" -> "fewest_stops"
  }

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, preference })
    });

    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();

    // Support plain text or structured replies
    if (typeof data.reply === "string") {
      addBot(data.reply);
    } else {
      addBot("I have some routes for you:");
      (data.routes || []).forEach((r, i) => {
        addBot(
          `${i + 1}. Route ${r.route_id} — ${r.route_name}\n` +
          `   Stops: ${r.segment_stops.join(", ")}\n` +
          `   Duration: ~${r.duration_min} min | Distance: ${r.distance_km} km | Fare: ₹${r.fare} | Next bus: ${r.next_departure}`
        );
      });
    }
  } catch (err) {
    addBot("Hmm, something went wrong. Please try again.");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
