import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { SegmentedButtons, Divider } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';

const statsMock = {
  daily: {
    total: 7,
    files: [
      { type: 'Housing', count: 4 },
      { type: 'Scholarship', count: 3 },
    ],
  },
  weekly: {
    total: 22,
    files: [
      { type: 'Housing', count: 12 },
      { type: 'Scholarship', count: 6 },
      { type: 'Construction', count: 4 },
    ],
  },
  monthly: {
    total: 75,
    files: [
      { type: 'Housing', count: 35 },
      { type: 'Scholarship', count: 20 },
      { type: 'Construction', count: 15 },
      { type: 'Business License', count: 5 },
    ],
  },
};

export default function AdminStats() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const data = statsMock[selectedPeriod];

  const chartData = {
    labels: data.files.map((d) => d.type),
    datasets: [{ data: data.files.map((d) => d.count) }],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Processing Statistics</Text>

      <SegmentedButtons
        value={selectedPeriod}
        onValueChange={(value) => setSelectedPeriod(value as 'daily' | 'weekly' | 'monthly')}
        buttons={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Total Files: <Text style={styles.bold}>{data.total}</Text></Text>
        {data.files.map((f) => (
          <Text key={f.type} style={styles.summaryText}>
            {f.type}: <Text style={styles.bold}>{f.count}</Text>
          </Text>
        ))}
      </View>

      <Divider style={{ marginVertical: 16 }} />

      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - 40}
        height={260}
        fromZero
        yAxisLabel=""
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
          labelColor: () => '#003366',
          barPercentage: 0.6,
        }}
        style={{ borderRadius: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 10,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
    color: '#003366',
  },
});
