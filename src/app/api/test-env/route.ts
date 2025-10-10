import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ADMIN_PROJECT_ID: process.env.ADMIN_PROJECT_ID || 'not set',
    ADMIN_CLIENT_EMAIL: process.env.ADMIN_CLIENT_EMAIL || 'not set',
    ADMIN_PRIVATE_KEY_LENGTH: process.env.ADMIN_PRIVATE_KEY?.length || 0,
    ADMIN_STORAGE_BUCKET: process.env.ADMIN_STORAGE_BUCKET || 'not set',
    NODE_ENV: process.env.NODE_ENV,
  })
}
