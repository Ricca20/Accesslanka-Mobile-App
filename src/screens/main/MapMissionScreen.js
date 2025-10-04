import { useState } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, Card, Button, Chip, ProgressBar } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"

export default function MapMissionScreen() {
  const [selectedStatus, setSelectedStatus] = useState("all")

  const statusFilters = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ]

  const dummyMissions = [
    {
      id: 1,
      title: "Colombo Shopping Malls Survey",
      description: "Map accessibility features of major shopping centers in Colombo",
      status: "active",
      progress: 0.65,
      participants: 12,
      placesTotal: 15,
      placesCompleted: 10,
      startDate: "2024-01-10",
      endDate: "2024-01-25",
      reward: "Accessibility Champion Badge",
    },
    {
      id: 2,
      title: "Kandy Temple Accessibility",
      description: "Document accessibility of religious sites in Kandy",
      status: "upcoming",
      progress: 0,
      participants: 8,
      placesTotal: 20,
      placesCompleted: 0,
      startDate: "2024-02-01",
      endDate: "2024-02-15",
      reward: "Heritage Mapper Badge",
    },
    {
      id: 3,
      title: "Galle Fort Walkability",
      description: "Assess walkability and accessibility of Galle Fort area",
      status: "completed",
      progress: 1.0,
      participants: 15,
      placesTotal: 12,
      placesCompleted: 12,
      startDate: "2023-12-15",
      endDate: "2023-12-30",
      reward: "Fort Explorer Badge",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4CAF50"
      case "upcoming":
        return "#FF9800"
      case "completed":
        return "#2196F3"
      default:
        return "#666"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return "play-circle"
      case "upcoming":
        return "clock-outline"
      case "completed":
        return "check-circle"
      default:
        return "help-circle"
    }
  }

  const renderMission = ({ item }) => (
    <Card style={styles.missionCard}>
      <Card.Content>
        <View style={styles.missionHeader}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.missionTitle}>
              {item.title}
            </Text>
            <Chip
              icon={getStatusIcon(item.status)}
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + "20" }]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Chip>
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.description}>
          {item.description}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Icon name="account-group" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.statText}>
              {item.participants} participants
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.statText}>
              {item.placesCompleted}/{item.placesTotal} places
            </Text>
          </View>
        </View>

        {item.status === "active" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text variant="bodySmall" style={styles.progressText}>
                Progress
              </Text>
              <Text variant="bodySmall" style={styles.progressPercentage}>
                {Math.round(item.progress * 100)}%
              </Text>
            </View>
            <ProgressBar progress={item.progress} color="#4CAF50" style={styles.progressBar} />
          </View>
        )}

        <View style={styles.dateContainer}>
          <Text variant="bodySmall" style={styles.dateText}>
            {item.startDate} - {item.endDate}
          </Text>
        </View>

        <View style={styles.rewardContainer}>
          <Icon name="trophy" size={16} color="#FFD700" />
          <Text variant="bodySmall" style={styles.rewardText}>
            Reward: {item.reward}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          {item.status === "upcoming" && (
            <Button mode="outlined" style={styles.actionButton}>
              Join Mission
            </Button>
          )}
          {item.status === "active" && (
            <Button mode="contained" style={styles.actionButton}>
              Continue Mapping
            </Button>
          )}
          {item.status === "completed" && (
            <Button mode="text" style={styles.actionButton}>
              View Results
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )

  const filteredMissions =
    selectedStatus === "all" ? dummyMissions : dummyMissions.filter((mission) => mission.status === selectedStatus)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          MapMission
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Collaborative accessibility mapping
        </Text>

        <View style={styles.filterContainer}>
          {statusFilters.map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedStatus === filter.key}
              onPress={() => setSelectedStatus(filter.key)}
              style={styles.filterChip}
              accessibilityLabel={`Filter by ${filter.label} missions`}
            >
              {filter.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredMissions}
        renderItem={renderMission}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  missionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  missionHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  missionTitle: {
    flex: 1,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  statusChip: {
    alignSelf: "flex-start",
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#666",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressText: {
    color: "#666",
  },
  progressPercentage: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  dateContainer: {
    marginBottom: 12,
  },
  dateText: {
    color: "#666",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  rewardText: {
    color: "#666",
  },
  actionContainer: {
    alignItems: "flex-start",
  },
  actionButton: {
    alignSelf: "flex-start",
  },
})
