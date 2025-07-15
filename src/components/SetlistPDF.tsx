import { useTranslation } from 'next-i18next';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// Definir os tipos para as props
interface Song {
  id: number;
  title: string;
  artist: string;
  key?: string;
  bpm?: number;
  chords_formatada?: Array<{
    note: string;
    note_fmt: string;
  }>;
}

interface Setlist {
  name: string;
  songs: Song[];
}

interface SetlistPDFProps {
  setlist: Setlist;
}

// Criar estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'Helvetica-Bold',
  },
  songContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottom: '1px solid #EEE',
  },
  songTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  songDetails: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
  },
  chordsHeader: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 5,
    marginBottom: 5,
  },
  chordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    lineHeight: 1.5,
  },
  chord: {
    fontSize: 11,
    marginRight: 10,
    marginBottom: 5,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

const SetlistPDF = ({ setlist }: SetlistPDFProps) => {
  const { t } = useTranslation('common');
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{setlist.name}</Text>
        {setlist.songs.map((song, index) => (
          <View key={song.id} style={styles.songContainer} wrap={false}>
            <Text style={styles.songTitle}>{index + 1}. {song.title} - {song.artist}</Text>
            <Text style={styles.songDetails}>
              {t('setlistPDF.key')}: {song.key || t('setlistPDF.notInformed')} | {t('setlistPDF.bpm')}: {song.bpm || t('setlistPDF.notInformed')}
            </Text>
          </View>
        ))}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default SetlistPDF;
