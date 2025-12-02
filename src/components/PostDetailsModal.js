import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  Portal,
  Modal,
  TextInput,
  Button,
  Text,
  IconButton,
  Divider,
  Avatar,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../context/ThemeContext";
import CommunityService from "../backend/services/CommunityService";

const PostDetailsModal = ({
  visible,
  onDismiss,
  post,
  currentUserId,
  onPostUpdate,
  onPostDelete,
}) => {
  const { theme } = useTheme();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentLikes, setCommentLikes] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible && post?.id) {
      loadComments();
      trackPostView();
    }
  }, [visible, post?.id]);

  const trackPostView = async () => {
    try {
      await CommunityService.trackView(post.id);
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    setError("");
    try {
      const fetchedComments = await CommunityService.getComments(post.id);
      setComments(fetchedComments);

      // Load like status for each comment
      const likeStatuses = {};
      for (const comment of fetchedComments) {
        const status = await CommunityService.checkCommentLikeStatus(
          comment.id
        );
        likeStatuses[comment.id] = status.liked;
      }
      setCommentLikes(likeStatuses);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim().length === 0) {
      Alert.alert("Error", "Comment cannot be empty");
      return;
    }

    if (newComment.length > 1000) {
      Alert.alert("Error", "Comment cannot exceed 1000 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await CommunityService.addComment(
        post.id,
        newComment.trim(),
        replyingTo?.id || null
      );

      setNewComment("");
      setReplyingTo(null);
      await loadComments();

      // Update parent post comment count
      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          comments_count: (post.comments_count || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      Alert.alert("Error", `Failed to add comment: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    try {
      const result = await CommunityService.toggleCommentLike(commentId);

      // Update local state
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: result.liked,
      }));

      // Update comment likes count
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes_count: result.liked
                  ? (comment.likes_count || 0) + 1
                  : Math.max((comment.likes_count || 0) - 1, 0),
              }
            : comment
        )
      );
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
      Alert.alert("Error", "Failed to update like. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await CommunityService.deleteComment(commentId);
              await loadComments();

              // Update parent post comment count
              if (onPostUpdate) {
                onPostUpdate({
                  ...post,
                  comments_count: Math.max((post.comments_count || 0) - 1, 0),
                });
              }
            } catch (error) {
              console.error("Failed to delete comment:", error);
              Alert.alert("Error", "Failed to delete comment. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeletePost = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await CommunityService.deletePost(post.id);
            if (onPostDelete) {
              onPostDelete(post.id);
            }
            onDismiss();
            Alert.alert("Success", "Post deleted successfully");
          } catch (error) {
            console.error("Failed to delete post:", error);
            Alert.alert("Error", "Failed to delete post. Please try again.");
          }
        },
      },
    ]);
  };

  const renderComment = (comment, depth = 0) => {
    const isLiked = commentLikes[comment.id] || false;
    const isAuthor = comment.user_id === currentUserId;
    const replies = comments.filter((c) => c.parent_id === comment.id);

    return (
      <View key={comment.id} style={[styles.commentContainer, { marginLeft: depth * 20 }]}>
        <View style={styles.commentHeader}>
          <Avatar.Text
            size={36}
            label={comment.authorInitials || "U"}
            style={styles.commentAvatar}
            labelStyle={styles.commentAvatarLabel}
          />
          <View style={styles.commentHeaderText}>
            <Text variant="titleSmall" style={styles.commentAuthorName}>
              {comment.author || "Anonymous"}
            </Text>
            <View style={styles.commentTimeRow}>
              <Icon name="clock-time-four-outline" size={12} color="#999" />
              <Text variant="bodySmall" style={styles.commentTimeText}>
                {CommunityService.formatTimeAgo(comment.created_at)}
              </Text>
            </View>
          </View>
          {isAuthor && (
            <IconButton
              icon="delete"
              size={18}
              iconColor="#D32F2F"
              onPress={() => handleDeleteComment(comment.id)}
              style={styles.deleteCommentButton}
            />
          )}
        </View>

        <Text
          variant="bodyMedium"
          style={[styles.commentContent, { color: theme.colors.text }]}
        >
          {comment.content}
        </Text>

        <View style={styles.commentActions}>
          <Button
            mode={isLiked ? "contained-tonal" : "outlined"}
            compact
            icon={isLiked ? "heart" : "heart-outline"}
            onPress={() => handleToggleCommentLike(comment.id)}
            buttonColor={isLiked ? "#FFEBEE" : "transparent"}
            textColor={isLiked ? "#E91E63" : "#666"}
            style={styles.commentActionButton}
            labelStyle={styles.commentActionLabel}
          >
            {comment.likes_count || 0}
          </Button>
          <Button
            mode="outlined"
            compact
            icon="reply"
            onPress={() => setReplyingTo(comment)}
            textColor="#2E7D32"
            style={styles.commentActionButton}
            labelStyle={styles.commentActionLabel}
          >
            Reply
          </Button>
        </View>

        {replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map((reply) => renderComment(reply, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  if (!post) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 16 }}>Loading post...</Text>
          </View>
        </Modal>
      </Portal>
    );
  }

  const isAuthor = post.user_id === currentUserId;
  const topLevelComments = comments.filter((c) => !c.parent_id);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>

              <Text variant="headlineSmall" style={{ color: "#1A1A1A", fontWeight: "700" }}>
                Post Details
              </Text>
            </View>
            <View style={styles.headerActions}>
              {isAuthor && (
                <IconButton
                  icon="delete"
                  size={22}
                  iconColor="#D32F2F"
                  onPress={handleDeletePost}
                  style={styles.headerButton}
                />
              )}
              <IconButton 
                icon="close" 
                size={22} 
                onPress={onDismiss}
                iconColor="#666"
                style={styles.headerButton}
              />
            </View>
          </View>

          <Divider />

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Post Content */}
            <View style={styles.postContainer}>
              <View style={styles.postHeader}>
                <Avatar.Text
                  size={48}
                  label={post.authorInitials || "U"}
                  style={styles.postAvatar}
                  labelStyle={styles.postAvatarLabel}
                />
                <View style={styles.postHeaderText}>
                  <Text variant="titleMedium" style={styles.authorNameText}>
                    {post.author || "Anonymous"}
                  </Text>
                  <View style={styles.timeRow}>
                    <Icon name="clock-outline" size={14} color="#999" />
                    <Text
                      variant="bodySmall"
                      style={styles.timeText}
                    >
                      {CommunityService.formatTimeAgo(post.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.categoryContainer}>
                <Chip 
                  mode="flat" 
                  compact
                  style={styles.categoryChip}
                  textStyle={styles.categoryChipText}
                  icon={() => <Icon name="tag" size={14} color="#2E7D32" />}
                >
                  {post.category}
                </Chip>
              </View>

              <Text
                variant="titleLarge"
                style={[styles.postTitle, { color: theme.colors.text }]}
              >
                {post.title}
              </Text>

              <Text
                variant="bodyLarge"
                style={[styles.postContent, { color: theme.colors.text }]}
              >
                {post.content}
              </Text>

              {post.tags && post.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {post.tags.map((tag, index) => (
                    <Chip key={index} compact style={styles.tag}>
                      #{tag}
                    </Chip>
                  ))}
                </View>
              )}

              <View style={styles.postStats}>
                <View style={styles.statItem}>
                  <Icon name="heart" size={20} color="#E91E63" />
                  <Text variant="bodySmall" style={styles.statText}>{post.upvotes || 0}</Text>

                </View>
                <View style={styles.statItem}>
                  <Icon name="comment" size={20} color="#2196F3" />
                  <Text variant="bodySmall" style={styles.statText}>{post.comments_count || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="eye" size={20} color="#FF9800" />
                  <Text variant="bodySmall" style={styles.statText}>{post.views_count || 0}</Text>

                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <Text
                variant="titleMedium"
                style={[styles.commentsTitle, { color: theme.colors.text }]}
              >
                Comments ({comments.length})
              </Text>

              {error && (
                <Text variant="bodySmall" style={styles.errorText}>
                  {error}
                </Text>
              )}

              {loading ? (
                <ActivityIndicator size="large" style={styles.loader} />
              ) : topLevelComments.length > 0 ? (
                topLevelComments.map((comment) => renderComment(comment))
              ) : (
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.noCommentsText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No comments yet. Be the first to comment!
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <View
            style={[
              styles.commentInputContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
                  Replying to {replyingTo.author}
                </Text>
                <IconButton
                  icon="close"
                  size={16}
                  onPress={() => setReplyingTo(null)}
                />
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.author}...`
                    : "Write a comment..."
                }
                mode="outlined"
                multiline
                maxLength={1000}
                style={styles.commentInput}
                disabled={submitting}
              />
              <Button
                mode="contained"
                onPress={handleAddComment}
                loading={submitting}
                disabled={submitting || newComment.trim().length === 0}
                style={styles.sendButton}
              >
                Send
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 16,
    maxHeight: "92%",
    minHeight: 500,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  keyboardView: {
    flex: 1,
  },
  loadingModalContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    margin: 0,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  postContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  postAvatar: {
    backgroundColor: "#2E7D32",
    elevation: 3,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  postAvatarLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  postHeaderText: {
    marginLeft: 14,
    flex: 1,
  },
  authorNameText: {
    color: "#1A1A1A",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    color: "#999",
    fontSize: 13,
  },
  categoryContainer: {
    marginBottom: 16,
    flexDirection: "row",
  },
  categoryChip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
  },
  categoryChipText: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  postTitle: {
    fontWeight: "700",
    marginBottom: 14,
    fontSize: 22,
    lineHeight: 30,
    color: "#1A1A1A",
  },
  postContent: {
    marginBottom: 20,
    lineHeight: 26,
    fontSize: 16,
    color: "#444",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  statText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  divider: {
    marginVertical: 0,
    height: 8,
    backgroundColor: "#F5F5F5",
  },
  commentsSection: {
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  commentsTitle: {
    fontWeight: "700",
    marginBottom: 20,
    fontSize: 18,
    color: "#1A1A1A",
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
  },
  loader: {
    marginVertical: 32,
  },
  noCommentsText: {
    textAlign: "center",
    marginVertical: 32,
    fontStyle: "italic",
    fontSize: 15,
    color: "#999",
  },
  commentContainer: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  commentAvatar: {
    backgroundColor: "#2E7D32",
    elevation: 2,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  commentAvatarLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  commentHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  commentAuthorName: {
    color: "#1A1A1A",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
  },
  commentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentTimeText: {
    color: "#999",
    fontSize: 12,
  },
  deleteCommentButton: {
    margin: 0,
  },
  commentContent: {
    marginLeft: 42,
    marginBottom: 10,
    lineHeight: 22,
    fontSize: 15,
    color: "#333",
  },
  commentActions: {
    flexDirection: "row",
    marginLeft: 38,
    gap: 8,
    marginTop: 4,
  },
  commentActionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  commentActionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#E8F5E9",
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    padding: 16,
    backgroundColor: "#FFFFFF",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  replyingToContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "#F8F9FA",
  },
  sendButton: {
    alignSelf: "flex-end",
    fontColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    buttonColor: "#2E7D32",
    marginBottom: 2,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
});

export default PostDetailsModal;
