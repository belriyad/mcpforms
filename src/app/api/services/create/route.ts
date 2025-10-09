import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { CreateServiceRequest } from '@/types/service'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Server configuration error - Firebase Admin not initialized' },
        { status: 500 }
      )
    }

    const body: CreateServiceRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.clientName || !body.clientEmail || !body.templateIds || body.templateIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, clientName, clientEmail, templateIds' },
        { status: 400 }
      )
    }

    // Validate userId (createdBy) is provided
    if (!body.createdBy) {
      return NextResponse.json(
        { error: 'Missing createdBy field - user must be authenticated' },
        { status: 401 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create service document with user's ID using Firebase Admin SDK
    const adminDb = getAdminDb()
    const serviceData = {
      name: body.name,
      description: body.description || '',
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      status: 'draft',
      templateIds: body.templateIds,
      templates: [], // Will be populated in next step
      createdBy: body.createdBy, // User ID from authenticated request
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }

    const docRef = await adminDb.collection('services').add(serviceData)

    return NextResponse.json(
      { 
        success: true, 
        serviceId: docRef.id,
        message: 'Service created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
