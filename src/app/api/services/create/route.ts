import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CreateServiceRequest } from '@/types/service'

export async function POST(request: NextRequest) {
  try {
    const body: CreateServiceRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.clientName || !body.clientEmail || !body.templateIds || body.templateIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, clientName, clientEmail, templateIds' },
        { status: 400 }
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

    // Create service document
    const serviceData = {
      name: body.name,
      description: body.description || '',
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      status: 'draft',
      templateIds: body.templateIds,
      templates: [], // Will be populated in next step
      createdBy: 'admin', // TODO: Get from auth context
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const docRef = await addDoc(collection(db, 'services'), serviceData)

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
