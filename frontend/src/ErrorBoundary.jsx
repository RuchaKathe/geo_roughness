import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("VTK Render Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "red", padding: "1rem" }}>
          Visualization failed to render.
        </div>
      );
    }

    return this.props.children;
  }
}
