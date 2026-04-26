type TestUser = {
  id: string;
  email: string;
  name: string;
};

export const userDataExtensions = {
  HughJass: {
    id: "hKSq44iFgwaSU4MHnMoWs0IXsXeGyckF",
    email: "hugh-jass@example.com",
    name: "Hugh Jass",
  },
} as const satisfies Record<string, TestUser>;
