import { RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { errorText } from '../errors';
import { saidRight } from '../phrasal';
import { t } from '../i18n';
import { requireMicrophone } from '../services/microphone';
import { transcribe } from '../services/stt';
import { useStyles, useTheme } from '../theme';
import type { PhrasalDrill, Vocabulary, VocabularyEntry } from '../types';
import { createDrillStyles, drillRound, entriesOf, filled } from './PhrasalGaps';
import { SpeakerIcon } from './icons';
import { WideButton } from './WideButton';

interface Props {
  vocabulary: Vocabulary;
  drills: PhrasalDrill[];
  speaking: string | null;
  onSpeak: (text: string) => void;
  onLater: (entries: VocabularyEntry[]) => void;
}

/**
 * «Голосом»: то же предложение с пропуском, но ответ — вслух и целиком.
 * Перевод подсказывает смысл, пропуск — место глагола. Poly распознаёт речь и
 * сверяет глагол с частицей; верный вариант тут же читает вслух. Фразовый
 * глагол, сказанный в предложении, запоминается прочнее выбранного из списка.
 */
export function PhrasalSpeak({ vocabulary, drills, speaking, onSpeak, onLater }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createDrillStyles);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [round, setRound] = useState<PhrasalDrill[] | null>(null);
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  /** Что распознано по текущему предложению; null — ещё не отвечали. */
  const [heard, setHeard] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<PhrasalDrill[]>([]);
  const [postponed, setPostponed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    setRound(drillRound(drills));
    setIndex(0);
    setHeard(null);
    setMistakes([]);
    setPostponed(false);
    setError(null);
  };

  if (!round) {
    return (
      <View style={styles.stack}>
        <Text style={styles.note}>{t.speakIntro}</Text>
        <WideButton onPress={start} style={styles.primary}>
          <Text style={styles.primaryLabel}>{t.wordsQuizStart}</Text>
        </WideButton>
      </View>
    );
  }

  const drill = round[index];

  if (!drill) {
    return (
      <View style={styles.stack}>
        <Text style={styles.score}>{t.wordsQuizScore(round.length - mistakes.length, round.length)}</Text>
        {mistakes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.wordsQuizMistakes}</Text>
            {mistakes.map((item) => (
              <View key={item.sentence} style={styles.mistake}>
                <Text style={styles.mistakeAnswer}>{filled(item)}</Text>
                <Text style={styles.mistakeHint}>{item.translation}</Text>
              </View>
            ))}
          </View>
        )}
        {mistakes.length > 0 && !postponed && (
          <WideButton
            onPress={() => {
              onLater(entriesOf(vocabulary, mistakes));
              setPostponed(true);
            }}
            style={styles.primary}
          >
            <Text style={styles.primaryLabel}>{t.wordsQuizReviewMistakes}</Text>
          </WideButton>
        )}
        <WideButton onPress={start} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t.wordsQuizAgain}</Text>
        </WideButton>
      </View>
    );
  }

  const answered = heard !== null;
  const right = answered && saidRight(heard, drill.answer);
  const last = index === round.length - 1;
  const [before, rest] = drill.sentence.split('___');
  // Подсказка в скобках после пропуска («(venir)») после ответа больше не нужна.
  const after = answered ? rest.replace(/^\s*\([^)]*\)/, '') : rest;

  /** Первое нажатие открывает микрофон, второе — закрывает и проверяет. */
  const toggleRecording = async () => {
    setError(null);
    try {
      if (recording) {
        setRecording(false);
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error(t.recordingLost);
        setChecking(true);
        const text = await transcribe(uri, vocabulary.language);
        setHeard(text);
        if (!saidRight(text, drill.answer)) setMistakes((prev) => [...prev, drill]);
        onSpeak(filled(drill));
        return;
      }
      await requireMicrophone();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (e: unknown) {
      setRecording(false);
      setError(errorText(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.stack}>
      <Text style={styles.progress}>{t.wordsQuizQuestion(index + 1, round.length)}</Text>
      <View style={styles.card}>
        <Text style={styles.translation}>{drill.translation}</Text>
        <Text style={styles.sentence}>
          {before}
          <Text style={[styles.gap, answered && styles.gapRight]}>
            {answered ? drill.answer : ' ______ '}
          </Text>
          {after}
        </Text>
      </View>

      {error && <Text style={[styles.note, { color: theme.dangerText }]}>{error}</Text>}

      {answered ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{right ? t.speakRight : t.speakWrong}</Text>
          {!right && <Text style={styles.mistakeAnswer}>{filled(drill)}</Text>}
          <Text style={styles.mistakeHint}>
            {t.speakHeard} {heard || '—'}
          </Text>
          <Pressable
            onPress={() => onSpeak(filled(drill))}
            disabled={speaking !== null}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.speakListen}
            style={styles.after}
          >
            <SpeakerIcon size={20} color={theme.neon} />
            <Text style={styles.secondaryLabel}>{t.speakListen}</Text>
          </Pressable>
        </View>
      ) : (
        <WideButton
          onPress={() => void toggleRecording()}
          disabled={checking}
          style={[styles.primary, recording && { backgroundColor: theme.surface, borderColor: theme.danger }]}
        >
          {checking ? (
            <ActivityIndicator color={theme.ctaText} size="small" />
          ) : (
            <Text style={[styles.primaryLabel, recording && { color: theme.danger }]}>
              {recording ? t.speakStop : t.speakRecord}
            </Text>
          )}
        </WideButton>
      )}

      {answered && (
        <WideButton
          onPress={() => {
            setIndex(index + 1);
            setHeard(null);
          }}
          style={styles.primary}
        >
          <Text style={styles.primaryLabel}>{last ? t.wordsQuizFinish : t.wordsQuizNext}</Text>
        </WideButton>
      )}
    </View>
  );
}
