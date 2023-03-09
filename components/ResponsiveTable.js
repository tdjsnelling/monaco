import styled from "styled-components";

export default styled.div`
  display: grid;
  grid-template-columns: 1fr;
  min-height: 500px;

  @media screen and (min-width: 1800px) {
    grid-template-columns: 50% 50%;
  }
`;
