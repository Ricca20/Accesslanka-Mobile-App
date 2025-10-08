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
import { useTheme } from "../context/ThemeContext";
import CommunityService from "../services/CommunityService";

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
            size={32}
            label={comment.authorInitials || "U"}
            style={styles.commentAvatar}
          />
          <View style={styles.commentHeaderText}>
            <Text variant="titleSmall" style={{ color: theme.colors.text }}>
              {comment.author || "Anonymous"}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>
              {CommunityService.formatTimeAgo(comment.created_at)}
            </Text>
          </View>
          {isAuthor && (
            <IconButton
              icon="delete"
              size={16}
              onPress={() => handleDeleteComment(comment.id)}
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
            mode="text"
            compact
            icon={isLiked ? "heart" : "heart-outline"}
            onPress={() => handleToggleCommentLike(comment.id)}
          >
            {comment.likes_count || 0}
          </Button>
          <Button
            mode="text"
            compact
            icon="reply"
            onPress={() => setReplyingTo(comment)}
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
            <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
              Post Details
            </Text>
            <View style={styles.headerActions}>
              {isAuthor && (
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={handleDeletePost}
                />
              )}
              <IconButton icon="close" size={20} onPress={onDismiss} />
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
                  size={40}
                  label={post.authorInitials || "U"}
                />
                <View style={styles.postHeaderText}>
                  <Text variant="titleMedium" style={{ color: theme.colors.text }}>
                    {post.author || "Anonymous"}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {CommunityService.formatTimeAgo(post.created_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.categoryContainer}>
                <Chip mode="outlined" compact>
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
                  <IconButton icon="heart" size={16} />
                  <Text variant="bodySmall">{post.upvotes || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <IconButton icon="comment" size={16} />
                  <Text variant="bodySmall">{post.comments_count || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <IconButton icon="eye" size={16} />
                  <Text variant="bodySmall">{post.views_count || 0}</Text>
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
    margin: 20,
    maxHeight: "90%",
    minHeight: 500,
    borderRadius: 10,
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
    padding: 16,
  },
  headerActions: {
    flexDirection: "row",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  postContainer: {
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  postTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  postContent: {
    marginBottom: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  divider: {
    marginVertical: 8,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  loader: {
    marginVertical: 24,
  },
  noCommentsText: {
    textAlign: "center",
    marginVertical: 24,
    fontStyle: "italic",
  },
  commentContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAvatar: {
    backgroundColor: "#6200ee",
  },
  commentHeaderText: {
    marginLeft: 8,
    flex: 1,
  },
  commentContent: {
    marginLeft: 40,
    marginBottom: 8,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    marginLeft: 32,
  },
  repliesContainer: {
    marginTop: 8,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    padding: 12,
  },
  replyingToContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: "flex-end",
  },
});

export default PostDetailsModal;
