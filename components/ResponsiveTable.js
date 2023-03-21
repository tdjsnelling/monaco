import styled from "styled-components";

export default styled.div`
  display: grid;
  grid-template-columns: 1fr;
  min-height: 450px;
  overflow-x: auto;

  @media screen and (min-width: 1700px) {
    grid-template-columns: ${({ cols }) => cols ?? "50% 50%"};
  }
`;
