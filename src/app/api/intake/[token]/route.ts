import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Forward the request to our Cloud Function intakeFormAPI
    const cloudFunctionUrl = `https://us-central1-mcpforms-dev.cloudfunctions.net/intakeFormAPI/intake/${token}`;
    
    console.log(`🔗 Forwarding intake request to: ${cloudFunctionUrl}`);

    const response = await fetch(cloudFunctionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cloud Function error (${response.status}):`, errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: response.status === 404 
            ? 'Intake form not found or expired' 
            : 'Failed to load intake form'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Successfully fetched intake data:', { 
      success: data.success, 
      hasData: !!data.data,
      serviceName: data.data?.serviceName
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error in intake API route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while loading intake form'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Determine the endpoint based on the request body
    const isSubmit = body.intakeId && body.clientInfo;
    const endpoint = isSubmit ? 'submit' : 'save';
    
    // Forward the request to our Cloud Function intakeFormAPI
    const cloudFunctionUrl = isSubmit 
      ? `https://us-central1-mcpforms-dev.cloudfunctions.net/submitIntakeForm`
      : `https://us-central1-mcpforms-dev.cloudfunctions.net/intakeFormAPI/intake/${token}/save`;
    
    console.log(`🔗 Forwarding intake ${endpoint} to: ${cloudFunctionUrl}`);

    const response = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(isSubmit ? { data: body } : body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cloud Function ${endpoint} error (${response.status}):`, errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to ${endpoint} intake form data`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Successfully ${endpoint}ted intake data`);

    // If this was a submit, trigger document generation
    if (isSubmit && data.success) {
      try {
        console.log('🔄 Triggering document generation...');
        const docGenUrl = `https://us-central1-mcpforms-dev.cloudfunctions.net/generateDocumentsFromIntake`;
        
        const docResponse = await fetch(docGenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: { intakeId: body.intakeId } }),
        });
        
        if (docResponse.ok) {
          const docResult = await docResponse.json();
          console.log('✅ Document generation triggered successfully');
          
          // Add document generation info to response
          data.documentGeneration = docResult.result;
        } else {
          console.log('⚠️ Document generation failed, but intake was submitted');
        }
      } catch (docError) {
        console.error('❌ Error triggering document generation:', docError);
        // Don't fail the whole request if document generation fails
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error in intake save API route:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while saving intake form'
      },
      { status: 500 }
    );
  }
}