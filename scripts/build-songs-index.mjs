import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const songsDir = join(root, 'songs')
const outDir = join(root, 'public', 'songs')
const outFile = join(outDir, 'index.json')

mkdirSync(outDir, { recursive: true })

const files = readdirSync(songsDir).filter(
  (f) => f.endsWith('.json') && f !== 'index.json'
)

const songs = files.map((filename) => {
  const song = JSON.parse(readFileSync(join(songsDir, filename), 'utf-8'))

  return { ...song, source: 'repo' }
})

writeFileSync(outFile, JSON.stringify(songs, null, 2), 'utf-8')
console.log(`[build-songs-index] wrote ${songs.length} songs → public/songs/index.json`)
