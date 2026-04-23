export async function publishChapterVersionToRelay(chapterVersionId: string) {
  return {
    eventId: `stub-event-${chapterVersionId}`,
    relayUrl: "wss://relay.myth_story.local",
    relayCount: 1,
  }
}
