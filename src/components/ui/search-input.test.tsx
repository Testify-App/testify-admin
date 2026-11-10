import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SearchInput } from './search-input'

function Harness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <SearchInput
      aria-label="Search staff"
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange(next)
      }}
      hint={<kbd>⌘ K</kbd>}
    />
  )
}

it('shows an accessible clear button only while there is text', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<Harness onChange={onChange} />)
  const input = screen.getByRole('textbox', { name: 'Search staff' })
  expect(screen.queryByRole('button', { name: 'Clear search staff' })).not.toBeInTheDocument()
  expect(screen.getByText('⌘ K')).toBeInTheDocument()
  await user.type(input, 'ada')
  expect(screen.queryByText('⌘ K')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Clear search staff' }))
  expect(input).toHaveValue('')
  expect(input).toHaveFocus()
  expect(onChange).toHaveBeenLastCalledWith('')
  expect(screen.queryByRole('button', { name: 'Clear search staff' })).not.toBeInTheDocument()
})
