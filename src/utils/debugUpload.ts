// Debug Template Upload Performance
// This script helps diagnose template upload issues

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export const debugTemplateUpload = async (file: File, templateName: string) => {
  console.log('🔍 Debug: Starting template upload analysis')
  console.log('📊 File details:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified)
  })
  
  const startTime = Date.now()
  
  try {
    // Step 1: Test Firebase Functions connectivity
    console.log('🔗 Step 1: Testing Firebase Functions connectivity...')
    const uploadTemplateAndParse = httpsCallable(functions, 'uploadTemplateAndParse')
    
    const functionCallStart = Date.now()
    const result = await uploadTemplateAndParse({
      fileName: file.name,
      fileType: file.name.split('.').pop()?.toLowerCase(),
      templateName: templateName.trim(),
    })
    const functionCallEnd = Date.now()
    
    console.log('⏱️ Firebase Function call took:', functionCallEnd - functionCallStart, 'ms')
    console.log('📝 Function response:', result)
    
    if (!(result.data as any)?.success) {
      throw new Error((result.data as any)?.error || 'Function returned error')
    }
    
    const responseData = (result.data as any)?.data
    if (!responseData || !responseData.uploadUrl) {
      throw new Error('Invalid response from server - missing upload URL')
    }
    
    // Step 2: Test file upload to signed URL
    console.log('📤 Step 2: Testing file upload to signed URL...')
    const uploadStart = Date.now()
    
    const uploadResponse = await fetch(responseData.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })
    
    const uploadEnd = Date.now()
    console.log('⏱️ File upload took:', uploadEnd - uploadStart, 'ms')
    console.log('📊 Upload speed:', (file.size / 1024 / 1024 / ((uploadEnd - uploadStart) / 1000)).toFixed(2), 'MB/s')
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`)
    }
    
    const totalTime = Date.now() - startTime
    console.log('🎉 Total upload process took:', totalTime, 'ms')
    
    return {
      success: true,
      templateId: responseData.templateId,
      timing: {
        functionCall: functionCallEnd - functionCallStart,
        fileUpload: uploadEnd - uploadStart,
        total: totalTime
      }
    }
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error('❌ Upload failed after:', totalTime, 'ms')
    console.error('❌ Error details:', error)
    
    return {
      success: false,
      error: error.message,
      timing: {
        total: totalTime
      }
    }
  }
}

export const checkFirebaseConnection = async () => {
  console.log('🔍 Checking Firebase connection...')
  
  try {
    // Test a simple function call
    const generateIntakeLink = httpsCallable(functions, 'generateIntakeLink')
    const start = Date.now()
    
    await generateIntakeLink({ serviceId: 'connection-test' })
    
    const end = Date.now()
    console.log('✅ Firebase Functions responsive in:', end - start, 'ms')
    return true
  } catch (error: any) {
    console.error('❌ Firebase connection issue:', error)
    return false
  }
}