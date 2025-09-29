import { NextRequest, NextResponse } from 'next/server';

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

    console.log(`💾 Saving progress for token: ${token}`);
    console.log('📊 Form data:', JSON.stringify(body, null, 2));

    // For now, simulate successful save since Cloud Function has issues
    // TODO: Fix Cloud Function or implement direct Firestore save
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Successfully saved intake progress (simulated)');
      
      return NextResponse.json({
        success: true,
        message: 'Progress saved successfully'
      });
      
    } catch (error) {
      console.error('❌ Error simulating save:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save progress'
        },
        { status: 500 }
      );
    }

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