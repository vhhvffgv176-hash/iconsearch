import { Metadata } from 'next'
import BookmarksClient from './BookmarksClient'

export const metadata: Metadata = {
  title: 'Bookmarks & Saved Icons — IconSearch',
  description: 'View and manage your saved vector SVG icons, download customized icon collections, and organize your favorite open-source icon sets in one place.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BookmarksPage() {
  return (
    <main>
      <BookmarksClient />
    </main>
  )
}
