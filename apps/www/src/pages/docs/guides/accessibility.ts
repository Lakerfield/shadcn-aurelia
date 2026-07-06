interface KeyBinding {
  keys: string
  action: string
}

interface KeyboardMap {
  component: string
  pattern: string
  bindings: KeyBinding[]
}

export class Accessibility {
  readonly maps: KeyboardMap[] = [
    {
      component: 'Accordion',
      pattern: 'APG Accordion',
      bindings: [
        { keys: 'Enter / Space', action: 'Toggle the focused section' },
        { keys: 'ArrowDown / ArrowUp', action: 'Move focus to the next / previous header' },
        { keys: 'Home / End', action: 'Move focus to the first / last header' },
      ],
    },
    {
      component: 'Tabs',
      pattern: 'APG Tabs',
      bindings: [
        { keys: 'ArrowRight / ArrowLeft', action: 'Move to and activate the next / previous tab (ArrowDown/Up when vertical)' },
        { keys: 'Home / End', action: 'First / last tab' },
        { keys: 'Tab', action: 'Move focus into the active panel' },
      ],
    },
    {
      component: 'Checkbox / Switch / Toggle',
      pattern: 'APG Checkbox, Switch, Button',
      bindings: [{ keys: 'Space', action: 'Toggle the control (Enter also toggles Toggle)' }],
    },
    {
      component: 'Radio Group / Toggle Group',
      pattern: 'APG Radio Group',
      bindings: [
        { keys: 'Arrow keys', action: 'Move focus (radio: also selects)' },
        { keys: 'Space', action: 'Select / toggle the focused item' },
      ],
    },
    {
      component: 'Slider',
      pattern: 'APG Slider',
      bindings: [
        { keys: 'Arrow keys', action: 'Adjust by one step' },
        { keys: 'PageUp / PageDown', action: 'Adjust by a larger step' },
        { keys: 'Home / End', action: 'Minimum / maximum' },
      ],
    },
    {
      component: 'Input OTP',
      pattern: 'pin input',
      bindings: [
        { keys: 'Digits', action: 'Fill the focused slot and advance' },
        { keys: 'Backspace', action: 'Clear and move back' },
        { keys: 'ArrowLeft / ArrowRight', action: 'Move between slots' },
        { keys: 'Paste', action: 'Distributes the pasted code across slots' },
      ],
    },
    {
      component: 'Dialog / Alert Dialog / Sheet',
      pattern: 'APG Dialog (modal)',
      bindings: [
        { keys: 'Tab / Shift+Tab', action: 'Cycle focus inside the dialog (focus is trapped)' },
        { keys: 'Escape', action: 'Close the dialog' },
      ],
    },
    {
      component: 'Tooltip',
      pattern: 'APG Tooltip',
      bindings: [
        { keys: 'Focus / hover', action: 'Open after the delay' },
        { keys: 'Escape', action: 'Dismiss' },
      ],
    },
    {
      component: 'Popover / Hover Card',
      pattern: 'APG Disclosure/Dialog (non-modal)',
      bindings: [
        { keys: 'Enter / Space', action: 'Open from the trigger (popover)' },
        { keys: 'Escape', action: 'Close and return focus to the trigger' },
      ],
    },
    {
      component: 'Dropdown Menu / Context Menu / Menubar',
      pattern: 'APG Menu / Menubar',
      bindings: [
        { keys: 'Enter / Space / ArrowDown', action: 'Open the menu and focus the first item' },
        { keys: 'ArrowDown / ArrowUp', action: 'Move between items' },
        { keys: 'ArrowRight / ArrowLeft', action: 'Open / close a submenu (menubar: also moves between menus)' },
        { keys: 'Home / End', action: 'First / last item' },
        { keys: 'Characters', action: 'Typeahead to a matching item' },
        { keys: 'Escape', action: 'Close and return focus to the trigger' },
      ],
    },
    {
      component: 'Select',
      pattern: 'APG Listbox / select-only combobox',
      bindings: [
        { keys: 'Enter / Space / Arrow keys', action: 'Open the listbox' },
        { keys: 'ArrowDown / ArrowUp', action: 'Highlight the next / previous option' },
        { keys: 'Enter', action: 'Select the highlighted option' },
        { keys: 'Characters', action: 'Typeahead' },
        { keys: 'Escape', action: 'Close' },
      ],
    },
    {
      component: 'Combobox / Command',
      pattern: 'APG Combobox',
      bindings: [
        { keys: 'Typing', action: 'Filter the options' },
        { keys: 'ArrowDown / ArrowUp', action: 'Open / move the highlight' },
        { keys: 'Enter', action: 'Select the highlighted option' },
        { keys: 'Escape', action: 'Close (command: clear, then close)' },
      ],
    },
    {
      component: 'Calendar / Date Picker',
      pattern: 'APG Date Picker Dialog',
      bindings: [
        { keys: 'Arrow keys', action: 'Move by day / week' },
        { keys: 'PageUp / PageDown', action: 'Previous / next month (Shift: year)' },
        { keys: 'Enter / Space', action: 'Select the focused date' },
        { keys: 'Escape', action: 'Close the picker' },
      ],
    },
    {
      component: 'Resizable',
      pattern: 'APG Window Splitter',
      bindings: [
        { keys: 'Arrow keys', action: 'Resize by 1% (Shift: 10%)' },
        { keys: 'Home / End', action: 'Collapse / expand the panel' },
      ],
    },
    {
      component: 'Sidebar',
      pattern: 'composite',
      bindings: [{ keys: 'Ctrl/Cmd + B', action: 'Toggle the sidebar' }],
    },
    {
      component: 'Message Scroller',
      pattern: 'scroll region (role=region + role=log)',
      bindings: [
        { keys: 'Tab', action: 'Focus the transcript viewport, then the scroll button when visible' },
        { keys: 'Arrow keys / PageUp / PageDown / Home / End', action: 'Scroll the focused viewport (releases follow-bottom)' },
        { keys: 'Enter / Space', action: 'On the scroll button: jump to the newest (or first) message' },
      ],
    },
  ]
}
