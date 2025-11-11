import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  apk_id: string;
  platform: 'development' | 'release-candidate' | 'production';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { apk_id, platform }: PublishRequest = await req.json();

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`🚀 Publishing APK ${apk_id} to ${platform} by user ${user.id}`);

    // 1. Get APK metadata
    const { data: apk, error: apkError } = await supabase
      .from('apk_files')
      .select('*')
      .eq('id', apk_id)
      .single();

    if (apkError || !apk) {
      throw new Error(`APK not found: ${apkError?.message}`);
    }

    console.log(`📦 Found APK: ${apk.name} (${apk.package_name})`);

    // 2. Get target directory from settings
    const settingKey = platform === 'development' ? 'dev_directory' :
                       platform === 'release-candidate' ? 'rc_directory' :
                       'prod_directory';

    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', settingKey)
      .maybeSingle();

    const targetDir = setting?.value || platform;
    console.log(`📁 Target directory: ${targetDir}`);

    // 3. Create publication record
    const { data: publication, error: pubError } = await supabase
      .from('publications')
      .insert({
        apk_id,
        platform,
        status: 'publishing',
        published_by: user.id,
      })
      .select()
      .single();

    if (pubError) {
      throw new Error(`Failed to create publication: ${pubError.message}`);
    }

    console.log(`📝 Created publication record: ${publication.id}`);

    try {
      // 4. Download source file
      console.log(`⬇️  Downloading from: ${apk.storage_path}`);
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('apk-files')
        .download(apk.storage_path);

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`);
      }

      console.log(`✅ Downloaded ${fileData.size} bytes`);

      // 5. Upload to target directory
      const targetPath = `${targetDir}/${apk.name}`;
      console.log(`⬆️  Uploading to: ${targetPath}`);

      const { error: uploadError } = await supabase
        .storage
        .from('apk-files')
        .upload(targetPath, fileData, {
          upsert: true,
          contentType: 'application/vnd.android.package-archive',
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log(`✅ Uploaded successfully`);

      // 6. Update publication status to completed
      await supabase
        .from('publications')
        .update({
          status: 'completed',
          target_path: targetPath,
          completed_at: new Date().toISOString(),
        })
        .eq('id', publication.id);

      console.log(`✅ Publication completed successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          publication: {
            ...publication,
            status: 'completed',
            target_path: targetPath,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update publication status to failed
      await supabase
        .from('publications')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', publication.id);

      throw error;
    }

  } catch (error) {
    console.error('❌ Publication error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Publication failed';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
