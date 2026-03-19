import React from 'react'
import {
 
    Segment,
    Placeholder,
  } from "semantic-ui-react";
export default function PreLoader() {
  return (
    <Segment textAlign="center" style={{ margin: "auto" }}>
          <Placeholder>
            <Placeholder.Header image>
              <Placeholder.Line />
              <Placeholder.Line />
            </Placeholder.Header>
            <Placeholder.Paragraph>
              <Placeholder.Line />
              <Placeholder.Line />
              <Placeholder.Line />
              <Placeholder.Line />
            </Placeholder.Paragraph>
          </Placeholder>
        </Segment>
  )
}
