export type MinecraftVersionGroup = {
  label: string;
  versions: string[];
};

/*
 * ROSIS PACK
 * Minecraft release-version database.
 *
 * This intentionally contains RELEASE versions, not snapshots,
 * pre-releases, release candidates, or development builds.
 */

export const MINECRAFT_JAVA_VERSIONS: string[] = [
  // 2026 numbering
  "26.2",
  "26.1.2",
  "26.1.1",
  "26.1",

  // 2025
  "1.21.11",
  "1.21.10",
  "1.21.9",
  "1.21.8",
  "1.21.7",
  "1.21.6",
  "1.21.5",
  "1.21.4",
  "1.21.3",
  "1.21.2",
  "1.21.1",
  "1.21",

  // 1.20
  "1.20.6",
  "1.20.5",
  "1.20.4",
  "1.20.3",
  "1.20.2",
  "1.20.1",
  "1.20",

  // 1.19
  "1.19.4",
  "1.19.3",
  "1.19.2",
  "1.19.1",
  "1.19",

  // 1.18
  "1.18.2",
  "1.18.1",
  "1.18",

  // 1.17
  "1.17.1",
  "1.17",

  // 1.16
  "1.16.5",
  "1.16.4",
  "1.16.3",
  "1.16.2",
  "1.16.1",

  // 1.15
  "1.15.2",
  "1.15.1",
  "1.15",

  // 1.14
  "1.14.4",
  "1.14.3",
  "1.14.2",
  "1.14.1",
  "1.14",

  // 1.13
  "1.13.2",
  "1.13.1",
  "1.13",

  // 1.12
  "1.12.2",
  "1.12.1",
  "1.12",

  // 1.11
  "1.11.2",
  "1.11.1",
  "1.11",

  // 1.10
  "1.10.2",
  "1.10.1",
  "1.10",

  // 1.9
  "1.9.4",
  "1.9.3",
  "1.9.2",
  "1.9.1",
  "1.9",

  // 1.8
  "1.8.9",
  "1.8.8",
  "1.8.7",
  "1.8.6",
  "1.8.5",
  "1.8.4",
  "1.8.3",
  "1.8.2",
  "1.8.1",
  "1.8",

  // 1.7
  "1.7.10",
  "1.7.9",
  "1.7.8",
  "1.7.7",
  "1.7.6",
  "1.7.5",
  "1.7.4",
  "1.7.3",
  "1.7.2",

  // 1.6
  "1.6.4",
  "1.6.2",
  "1.6.1",

  // 1.5
  "1.5.2",
  "1.5.1",

  // 1.4
  "1.4.7",
  "1.4.6",
  "1.4.5",
  "1.4.4",
  "1.4.3",
  "1.4.2",

  // 1.3
  "1.3.2",
  "1.3.1",

  // 1.2
  "1.2.5",
  "1.2.4",
  "1.2.3",
  "1.2.2",
  "1.2.1",

  // 1.1
  "1.1",

  // 1.0
  "1.0.1",
  "1.0.0",
];

export const MINECRAFT_BEDROCK_VERSIONS: string[] = [
  // Current numbering
  "26.40",
  "26.35",
  "26.34",
  "26.33",
  "26.32",
  "26.31",
  "26.30",
  "26.23",
  "26.21",
  "26.20",
  "26.13",
  "26.12",
  "26.11",
  "26.10",
  "26.3",
  "26.2",
  "26.1",
  "26.0",

  // 1.21 series
  "1.21.132",
  "1.21.131",
  "1.21.130",
  "1.21.124",
  "1.21.123",
  "1.21.122",
  "1.21.121",
  "1.21.120",
  "1.21.100",
  "1.21.93",
  "1.21.92",
  "1.21.90",
  "1.21.80",
  "1.21.70",
  "1.21.60",
  "1.21.50",
  "1.21.40",
  "1.21.30",
  "1.21.20",
  "1.21.2",
  "1.21.1",
  "1.21.0",

  // 1.20 series
  "1.20.80",
  "1.20.70",
  "1.20.60",
  "1.20.50",
  "1.20.40",
  "1.20.32",
  "1.20.31",
  "1.20.30",
  "1.20.15",
  "1.20.14",
  "1.20.13",
  "1.20.12",
  "1.20.10",
  "1.20.1",
  "1.20.0",

  // 1.19 series
  "1.19.83",
  "1.19.81",
  "1.19.80",
  "1.19.73",
  "1.19.72",
  "1.19.71",
  "1.19.70",
  "1.19.63",
  "1.19.62",
  "1.19.60",
  "1.19.51",
  "1.19.50",
  "1.19.41",
  "1.19.40",
  "1.19.31",
  "1.19.30",
  "1.19.22",
  "1.19.21",
  "1.19.20",
  "1.19.10",
  "1.19.2",
  "1.19.1",
  "1.19.0",

  // 1.18 series
  "1.18.33",
  "1.18.32",
  "1.18.31",
  "1.18.30",
  "1.18.12",
  "1.18.11",
  "1.18.10",
  "1.18.2",
  "1.18.1",
  "1.18.0",

  // 1.17 series
  "1.17.41",
  "1.17.40",
  "1.17.34",
  "1.17.33",
  "1.17.32",
  "1.17.30",
  "1.17.11",
  "1.17.10",
  "1.17.2",
  "1.17.1",
  "1.17.0",

  // Older Bedrock releases
  "1.16.221",
  "1.16.220",
  "1.16.210",
  "1.16.201",
  "1.16.200",
  "1.16.100",
  "1.16.40",
  "1.16.20",
  "1.16.1",
  "1.16.0",

  "1.15.10",
  "1.15.0",

  "1.14.60",
  "1.14.30",
  "1.14.25",
  "1.14.20",
  "1.14.1",
  "1.14.0",

  "1.13.3",
  "1.13.2",
  "1.13.1",
  "1.13.0",

  "1.12.1",
  "1.12.0",

  "1.11.4",
  "1.11.3",
  "1.11.2",
  "1.11.1",
  "1.11.0",

  "1.10.1",
  "1.10.0",

  "1.9.1",
  "1.9.0",

  "1.8.9",
  "1.8.8",
  "1.8.0",

  "1.7.0",

  "1.6.4",
  "1.6.3",
  "1.6.2",
  "1.6.1",
  "1.6.0",

  "1.5.3",
  "1.5.2",
  "1.5.1",
  "1.5.0",

  "1.4.1",
  "1.4.0",

  "1.3.2",
  "1.3.1",
  "1.3.0",

  "1.2.13",
  "1.2.12",
  "1.2.11",
  "1.2.10",
  "1.2.9",
  "1.2.8",
  "1.2.7",
  "1.2.6",
  "1.2.5",
  "1.2.4",
  "1.2.3",
  "1.2.2",
  "1.2.1",
  "1.2.0",

  "1.1.7",
  "1.1.6",
  "1.1.5",
  "1.1.4",
  "1.1.3",
  "1.1.2",
  "1.1.1",
  "1.1.0",

  "1.0.0",
];

export const MINECRAFT_JAVA_VERSION_GROUPS: MinecraftVersionGroup[] = [
  {
    label: "Java 26.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("26."),
    ),
  },
  {
    label: "Java 1.21.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.21"),
    ),
  },
  {
    label: "Java 1.20.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.20"),
    ),
  },
  {
    label: "Java 1.19.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.19"),
    ),
  },
  {
    label: "Java 1.18.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.18"),
    ),
  },
  {
    label: "Java 1.17.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.17"),
    ),
  },
  {
    label: "Java 1.16.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.16"),
    ),
  },
  {
    label: "Java 1.15.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.15"),
    ),
  },
  {
    label: "Java 1.14.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.14"),
    ),
  },
  {
    label: "Java 1.13.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.13"),
    ),
  },
  {
    label: "Java 1.12.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.12"),
    ),
  },
  {
    label: "Java 1.11.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.11"),
    ),
  },
  {
    label: "Java 1.10.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.10"),
    ),
  },
  {
    label: "Java 1.9.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.9"),
    ),
  },
  {
    label: "Java 1.8.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.8"),
    ),
  },
  {
    label: "Java 1.7.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.7"),
    ),
  },
  {
    label: "Java 1.6.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.6"),
    ),
  },
  {
    label: "Java 1.5.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.5"),
    ),
  },
  {
    label: "Java 1.4.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.4"),
    ),
  },
  {
    label: "Java 1.3.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.3"),
    ),
  },
  {
    label: "Java 1.2.x",
    versions: MINECRAFT_JAVA_VERSIONS.filter((v) =>
      v.startsWith("1.2"),
    ),
  },
  {
    label: "Java 1.1",
    versions: ["1.1"],
  },
  {
    label: "Java 1.0.x",
    versions: ["1.0.1", "1.0.0"],
  },
];

export const MINECRAFT_BEDROCK_VERSION_GROUPS: MinecraftVersionGroup[] = [
  {
    label: "Bedrock 26.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("26."),
    ),
  },
  {
    label: "Bedrock 1.21.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.21"),
    ),
  },
  {
    label: "Bedrock 1.20.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.20"),
    ),
  },
  {
    label: "Bedrock 1.19.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.19"),
    ),
  },
  {
    label: "Bedrock 1.18.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.18"),
    ),
  },
  {
    label: "Bedrock 1.17.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.17"),
    ),
  },
  {
    label: "Bedrock 1.16.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.16"),
    ),
  },
  {
    label: "Bedrock 1.15.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.15"),
    ),
  },
  {
    label: "Bedrock 1.14.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.14"),
    ),
  },
  {
    label: "Bedrock 1.13.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.13"),
    ),
  },
  {
    label: "Bedrock 1.12.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.12"),
    ),
  },
  {
    label: "Bedrock 1.11.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.11"),
    ),
  },
  {
    label: "Bedrock 1.10.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.10"),
    ),
  },
  {
    label: "Bedrock 1.9.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.9"),
    ),
  },
  {
    label: "Bedrock 1.8.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.8"),
    ),
  },
  {
    label: "Bedrock 1.7.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.7"),
    ),
  },
  {
    label: "Bedrock 1.6.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.6"),
    ),
  },
  {
    label: "Bedrock 1.5.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.5"),
    ),
  },
  {
    label: "Bedrock 1.4.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.4"),
    ),
  },
  {
    label: "Bedrock 1.3.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.3"),
    ),
  },
  {
    label: "Bedrock 1.2.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.2"),
    ),
  },
  {
    label: "Bedrock 1.1.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.1"),
    ),
  },
  {
    label: "Bedrock 1.0.x",
    versions: MINECRAFT_BEDROCK_VERSIONS.filter((v) =>
      v.startsWith("1.0"),
    ),
  },
];
