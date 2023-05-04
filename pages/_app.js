import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  :root {
    --space-0: 0px;
    --space-1: 2px;
    --space-2: 4px;
    --space-3: 8px;
    --space-4: 16px;
    --space-5: 32px;
    --space-6: 64px;
    
    --colour-bg: #000;
    --colour-fg: #f0f0f0;
    --colour-border: #555;
    --colour-offset: #222;
    
    --fontSize-small: 10px;
    --fontSize-body: 12px;
    --fontFamily-body: 'JetBrains Mono', monospace;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  body {
    background-color: var(--colour-bg);
    color: var(--colour-fg);
    font-family: var(--fontFamily-body);
    font-size: var(--fontSize-small);
    -webkit-text-size-adjust: 100%;
    
    @media screen and (min-width: 900px) {
      font-size: var(--fontSize-body);
    }
  }
  button {
    appearance: none;
    background-color: var(--colour-bg);
    color: var(--colour-fg);
    border: 1px solid var(--colour-fg);
    padding: var(--space-2) var(--space-3);
    font-size: var(--fontSize-small);
    font-family: var(--fontFamily-body);
    cursor: pointer;

    @media screen and (min-width: 900px) {
      font-size: var(--fontSize-body);
    }
  }
`;

export default function App({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <Component {...pageProps} />
    </>
  );
}
