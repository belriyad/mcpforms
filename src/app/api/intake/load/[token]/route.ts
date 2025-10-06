import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
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

    console.log('🔍 Loading intake form for token:', token)

    // Query services collection for intake form with matching token
    const servicesRef = collection(db, 'services')
    const q = query(servicesRef, where('intakeForm.token', '==', token))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log('❌ No service found with token:', token)
      return NextResponse.json(
        { success: false, error: 'Intake form not found or expired' },
        { status: 404 }
      )
    }

    const serviceDoc = querySnapshot.docs[0]
    const service = { id: serviceDoc.id, ...serviceDoc.data() } as Service

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load intake form',
      },
      { status: 500 }
    )
  }
}
