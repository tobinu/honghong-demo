import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { TTSRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, speechRate, loudnessRate } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 使用"魅力女友"音色
    const response = await client.synthesize({
      uid: 'honghong_user',
      text: text.substring(0, 200), // 限制文本长度
      speaker: 'zh_female_meilinvyou_saturn_bigtts',
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate: Math.max(-50, Math.min(100, speechRate)),
      loudnessRate: Math.max(-50, Math.min(100, loudnessRate)),
    });

    // 下载音频数据并转为 base64
    const audioResponse = await fetch(response.audioUri);
    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const audioDataUri = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl: audioDataUri,
      audioSize: response.audioSize,
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS synthesis failed' },
      { status: 500 }
    );
  }
}
