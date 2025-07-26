import React, { useState } from 'react'

import { Box, Heading, TextInput, Button } from 'grommet'

interface TitlePageProps {
  onContinue: (data: { title: string; subtitle: string }) => void
}

export default function TitlePage({ onContinue }: TitlePageProps) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')

  return (
    <Box pad="medium" gap="medium" align="start">
      <Heading level={2} size="xlarge" margin="none">
        Album Details
      </Heading>
      <Box gap="small" width="medium">
        <TextInput
          placeholder="Title"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
        />
        <TextInput
          placeholder="Subtitle"
          value={subtitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSubtitle(e.target.value)
          }
        />
        <Button
          primary
          label="Continue"
          onClick={() => onContinue({ title, subtitle })}
        />
      </Box>
    </Box>
  )
}
