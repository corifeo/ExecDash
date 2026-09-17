/* Mutable application state. Module-specific UI state (filters, open editors, import preview)
   lives next to the code that uses it; this file holds what the whole app shares. */

// Storage adapter (see 50-storage.js) and its load state: 'loading', 'ready' or 'none' (storage unavailable).
var DB = null,
  dbState = 'loading';

// Saved data, normalised. config includes the two registers (risks, initiatives);
// quarters is keyed by quarter id (for example '2026-Q3'). raw* keep the stored documents.
var config = null,
  quarters = {},
  rawCfg = null,
  rawRisks = null,
  rawInits = null;

// Which screen is showing and which quarter the dashboard displays.
var view = 'dashboard',
  selectedQ = null;

// Configure view: working copies (wcfg, wq) are edited in place and written on Save.
// editQ is the quarter being edited; dirty flags drive the save bar; armed holds the
// key of a delete button waiting for confirmation; msg/msgErr is the save bar message.
var wcfg = null,
  wq = null,
  editQ = null,
  dirtyCfg = false,
  dirtyQ = false,
  cfgTab = 'data',
  armed = null,
  msg = '',
  msgErr = false;

// Dashboard render context ({cfg, q, prev, pl}) kept so sections can re-render in place.
var CTX = null;
