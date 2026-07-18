import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate the user requesting the upload
        const user = getAuthUser(request);
        if (!user) {
          throw new Error('Unauthorized');
        }

        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'image/png', 'image/jpeg', 'image/gif'],
          tokenPayload: JSON.stringify({
            userId: user.userId,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed successfully:', blob);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Upload token generation failed" },
      { status: 400 },
    );
  }
}
