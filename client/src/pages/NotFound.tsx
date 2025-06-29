import { Link } from "wouter";
import typography from "@/styles/typography";

export default function NotFound() {
  return (
    <div 
      className="bg-background"
      style={{
        minHeight: "100vh",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
        maxWidth: "1200px",
        margin: "0 auto"
      }}
    >
      <h1 
        style={{
          ...typography.h1,
          marginBottom: "32px",
          color: "white"
        }}
      >
        Error 404
      </h1>
      
      <p 
        style={{
          ...typography.body,
          color: "rgba(255, 255, 255, 0.8)",
          marginBottom: "48px",
          maxWidth: "600px"
        }}
      >
        Don't worry, our best discoveries are the result of an error
      </p>
      
        <button
          style={{
            ...typography.button,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "32px",
            padding: "16px",
            color: "white",
            cursor: "pointer",
            transition: "all 0.2s ease",
            outline: "none",
            height: "56px",
            width: "100%",
          maxWidth: "400px",
            boxSizing: "border-box"
          }}
        onClick={() => window.history.back()}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
        >
          Back
        </button>
    </div>
  );
}
