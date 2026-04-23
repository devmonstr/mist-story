const command = ["bun", "run", "--filter", "@myth/db", "db:generate"]

const proc = Bun.spawn(command, {
  cwd: process.cwd(),
  stdout: "pipe",
  stderr: "pipe",
})

const [stdout, stderr, exitCode] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
  proc.exited,
])

if (stdout) {
  process.stdout.write(stdout)
}

if (stderr) {
  process.stderr.write(stderr)
}

if (exitCode === 0) {
  process.exit(0)
}

const output = `${stdout}\n${stderr}`
const prismaEngineLocked =
  process.platform === "win32" &&
  output.includes("EPERM") &&
  output.includes("query_engine-windows.dll.node")

if (prismaEngineLocked) {
  console.warn(
    [
      "[postinstall] Prisma generate could not replace the Windows query engine because another Bun/Node/Prisma process is still using it.",
      "[postinstall] Stop running dev servers or Prisma Studio, then run `bun run db:generate` once to finish the update.",
    ].join("\n")
  )
  process.exit(0)
}

process.exit(exitCode)
