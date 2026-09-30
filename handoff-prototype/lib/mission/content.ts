/**
 * Mission copy for PROXIMA — EOS MISSION ARCHIVE.
 *
 * Only established facts are stated as fact: Eos is a generation ship carrying
 * 10,000 people to Proxima Centauri; Captain Elena precedes Captain Sophia; the
 * voyage is multigenerational; Atlas is a related vessel using nuclear pulse
 * propulsion; a mysterious structure is encountered near Proxima.
 * Anything else shown in the UI is labelled illustrative or left unresolved.
 * Edit copy here; visuals live in components/mission/*Visualization.tsx.
 */

export type ModuleKey = "eos" | "navigation" | "command" | "anomaly";

export interface Fact {
  label: string;
  value: string;
  /** Rendered dimmed / struck to signal "not known". */
  unresolved?: boolean;
}

export interface Panel {
  title: string;
  body: string;
}

export interface ModuleContent {
  key: ModuleKey;
  number: string;
  name: string;
  title: string;
  /** One line on the tablet cartridge. */
  summary: string;
  /** Up to three facts on the cartridge and in the inspector. */
  facts: Fact[];
  /** Inspector side panels. */
  panels: Panel[];
  /** Disclaimer shown with the visualization. */
  note: string;
}

export const MISSION = {
  program: "PROXIMA",
  vessel: "EOS",
  archive: "EOS MISSION ARCHIVE",
  tabletTitle: "EOS MISSION COMMAND",
  tabletSubtitle: "PORTABLE OPERATIONS TERMINAL",
  wallTitle: "PROXIMA / EOS",
  wallSubtitle: "MISSION COMMAND INTERFACE",
  emptyWall: "AWAITING MISSION DATA",
  hint: "FLICK UP TO TRANSFER",
  dockTitle: "ON COMMAND DISPLAY",
  dockAction: "TAP TO RETRIEVE",
};

export const CONTENT: Record<ModuleKey, ModuleContent> = {
  eos: {
    key: "eos",
    number: "01",
    name: "EOS",
    title: "VESSEL OVERVIEW",
    summary: "Generation vessel bound for Proxima Centauri.",
    facts: [
      { label: "CLASS", value: "GENERATION VESSEL" },
      { label: "POPULATION", value: "10,000" },
      { label: "DESTINATION", value: "PROXIMA CENTAURI" },
    ],
    panels: [
      {
        title: "MISSION",
        body: "Carry a population of ten thousand people from Earth to the Proxima Centauri system.",
      },
      {
        title: "MULTIGENERATIONAL VOYAGE",
        body: "The crossing spans generations. The people who arrive will not be the people who departed.",
      },
    ],
    note: "CONCEPTUAL VISUALIZATION · NOT A CANONICAL SCHEMATIC",
  },
  navigation: {
    key: "navigation",
    number: "02",
    name: "NAVIGATION",
    title: "INTERSTELLAR TRAJECTORY",
    summary: "Transit plot from the Sol system to Proxima Centauri.",
    facts: [
      { label: "ORIGIN", value: "SOL SYSTEM" },
      { label: "DESTINATION", value: "PROXIMA CENTAURI" },
      { label: "PHASE", value: "INTERSTELLAR TRANSIT" },
    ],
    panels: [
      {
        title: "EOS TRAJECTORY",
        body: "Plotted course between the Sol system and Proxima Centauri. Positions shown are illustrative.",
      },
      {
        title: "RELATED VESSEL · ATLAS",
        body: "Atlas is driven by nuclear pulse propulsion.",
      },
    ],
    note: "ILLUSTRATIVE PLOT · NOT TO SCALE · NO CANONICAL MEASUREMENTS",
  },
  command: {
    key: "command",
    number: "03",
    name: "COMMAND",
    title: "MISSION LEADERSHIP",
    summary: "Command archive and succession record of the Eos.",
    facts: [
      { label: "CAPTAIN", value: "ELENA" },
      { label: "CAPTAIN", value: "SOPHIA" },
      { label: "RECORD", value: "SUCCESSION" },
    ],
    panels: [
      {
        title: "COMMAND SUCCESSION",
        body: "Captain Elena precedes Captain Sophia in command of the Eos.",
      },
      {
        title: "ARCHIVE STATUS",
        body: "Additional personnel records pending verification.",
      },
    ],
    note: "IDENTIFICATION GRAPHICS ARE ABSTRACT · NO PORTRAITS ON FILE",
  },
  anomaly: {
    key: "anomaly",
    number: "04",
    name: "ANOMALY",
    title: "PROXIMA STRUCTURE",
    summary: "Unidentified structure observed in the Proxima system.",
    facts: [
      { label: "OBJECT", value: "UNIDENTIFIED STRUCTURE" },
      { label: "LOCATION", value: "PROXIMA SYSTEM" },
      { label: "CLASSIFICATION", value: "UNKNOWN" },
    ],
    panels: [
      {
        title: "OBSERVATIONAL DATA",
        body: "Partial scans only. Resolution insufficient for identification.",
      },
      {
        title: "ANALYSIS",
        body: "Origin and purpose unresolved.",
      },
    ],
    note: "INCOMPLETE DATA · CLASSIFICATION: UNKNOWN",
  },
};
