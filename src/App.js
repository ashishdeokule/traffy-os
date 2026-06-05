import React, { useState, useEffect } from "react";

export default function App() {
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [steps, setSteps] = useState("");
  const [protein, setProtein] = useState("");

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("traffy")
    );

    if (saved) {
      setWeight(saved.weight || "");
      setWaist(saved.waist || "");
      setSteps(saved.steps || "");
      setProtein(saved.protein || "");
    }
  }, []);

  const saveData = () => {
    localStorage.setItem(
      "traffy",
      JSON.stringify({
        weight,
        waist,
        steps,
        protein
      })
    );

    alert("Saved");
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial"
      }}
    >
      <h1>Traffy OS</h1>

      <h2>Daily Check-In</h2>

      <input
        placeholder="Weight (kg)"
        value={weight}
        onChange={(e) =>
          setWeight(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Waist (inches)"
        value={waist}
        onChange={(e) =>
          setWaist(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Steps"
        value={steps}
        onChange={(e) =>
          setSteps(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Protein (g)"
        value={protein}
        onChange={(e) =>
          setProtein(e.target.value)
        }
      />

      <br /><br />

      <button onClick={saveData}>
        Save Progress
      </button>

      <hr />

      <h3>Current Goal</h3>

      <p>Waist: {waist}"</p>
      <p>Target: 34"</p>
      <p>Weight: {weight} kg</p>
      <p>Steps: {steps}</p>
      <p>Protein: {protein} g</p>
    </div>
  );
}
