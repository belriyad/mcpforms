import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin'
import { Service } from '@/types/service'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check if Admin SDK is initialized
    if (!isAdminInitialized()) {
      console.error('❌ Firebase Admin SDK not initialized')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('🔍 Loading intake form for token:', token)

    // Use Admin SDK to query services collection
    const adminDb = getAdminDb()
    console.log('📡 Querying services with intakeForm.token ==', token)
    
    const querySnapshot = await adminDb
      .collection('services')
      .where('intakeForm.token', '==', token)
      .limit(1)
      .get()
    
    console.log('📡 Query completed. Results:', querySnapshot.size)

    if (querySnapshot.empty) {
      console.log('❌ No service found with token:', token)
      return NextResponse.json(
        { success: false, error: 'Intake form not found or expired' },
        { status: 404 }
      )
    }

    const serviceDoc = querySnapshot.docs[0]
    const serviceData = serviceDoc.data()
    const service = { id: serviceDoc.id, ...serviceData } as any

    // Check if service has intake form
    if (!service.intakeForm) {
      console.log('❌ Service has no intake form:', service.id)
      return NextResponse.json(
        { success: false, error: 'Intake form not generated for this service' },
        { status: 404 }
      )
    }

    // Build response data
    const responseData = {
      intakeId: service.intakeForm.id,
      serviceId: service.id,
      serviceName: service.name,
      serviceDescription: service.description || '',
      formFields: service.intakeForm.fields || [],
      clientData: service.clientResponse?.responses || {},
      status: service.status,
      clientName: service.clientName,
      clientEmail: service.clientEmail,
      // Customization features (not implemented yet)
      customizationEnabled: false,
      customizationRules: null,
      existingCustomFields: [],
      existingCustomClauses: [],
      // Statistics
      totalFields: service.intakeForm.totalFields,
      uniqueFields: service.intakeForm.uniqueFields,
      duplicatesRemoved: service.intakeForm.duplicatesRemoved,
    }

    console.log('✅ Successfully loaded intake form:', {
      serviceId: service.id,
      serviceName: service.name,
      fieldsCount: responseData.formFields.length,
      status: service.status,
    })

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('❌ Error loading intake form:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load intake form',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

